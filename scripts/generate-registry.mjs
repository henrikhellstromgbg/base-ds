#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';

const root = process.cwd();
const contract = JSON.parse(readFileSync(join(root, 'design-system/registry.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packageVersions = { ...packageJson.dependencies, ...packageJson.devDependencies };
const iconBarrel = 'components/icons.ts';
const tokenFiles = ['tokens/primitives.css', 'tokens/semantic.css'];
const registryBaseUrl = 'https://raw.githubusercontent.com/henrikhellstromgbg/base-ds/main/public/r';
const tokenRegistryUrl = `${registryBaseUrl}/base-ds-tokens.json`;
const generatedRoot = 'node_modules/.cache/base-ds-registry';

rmSync(join(root, 'public/r/_generated'), { recursive: true, force: true });
rmSync(join(root, generatedRoot), { recursive: true, force: true });

function sourcePath(entrypoint) {
  return `${contract.surfaces.componentRoot}/${entrypoint}.tsx`;
}

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

function resolveLocal(fromPath, specifier) {
  let candidate;
  if (specifier.startsWith('@/')) candidate = specifier.slice(2);
  else if (specifier.startsWith('.')) candidate = normalize(join(dirname(fromPath), specifier));
  else return undefined;

  const candidates = extname(candidate)
    ? [candidate]
    : [`${candidate}.tsx`, `${candidate}.ts`, `${candidate}.jsx`, `${candidate}.js`, join(candidate, 'index.tsx'), join(candidate, 'index.ts')];
  return candidates.find((path) => {
    try {
      readFileSync(join(root, path));
      return true;
    } catch {
      return false;
    }
  });
}

function importsFor(path) {
  const source = readFileSync(join(root, path), 'utf8');
  const specifiers = new Set();
  for (const match of source.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    specifiers.add(match[1]);
  }
  return [...specifiers];
}

function dependencyClosure(initialPaths) {
  const files = new Set();
  const dependencies = new Set();
  const queue = [...initialPaths];

  while (queue.length) {
    const path = queue.shift();
    if (!path || files.has(path)) continue;
    files.add(path);
    for (const specifier of importsFor(path)) {
      const local = resolveLocal(path, specifier);
      if (local) queue.push(local);
      else if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
        const name = packageName(specifier);
        if (!['react', 'react-dom', 'next'].includes(name)) dependencies.add(name);
      }
    }
  }

  return { files: [...files].sort(), dependencies: [...dependencies].sort() };
}

function fileType(path) {
  if (path.startsWith('components/ui/')) return 'registry:ui';
  if (path.startsWith('components/')) return 'registry:component';
  if (path.startsWith('hooks/')) return 'registry:hook';
  if (path.startsWith('lib/')) return 'registry:lib';
  return 'registry:file';
}

function registryFile(path) {
  const type = fileType(path);
  return type === 'registry:file' ? { path, type, target: path } : { path, type };
}

function iconExportsFor(paths) {
  const exports = new Set();

  for (const path of paths) {
    const source = readFileSync(join(root, path), 'utf8');
    for (const match of source.matchAll(/import\s*{([^}]+)}\s*from\s*['"]@\/components\/icons['"]/g)) {
      for (const specifier of match[1].split(',')) {
        const name = specifier.trim();
        if (name) exports.add(name);
      }
    }
  }

  return [...exports].sort();
}

function individualFiles(entrypoint, paths) {
  const iconExports = iconExportsFor(paths);
  const iconModulePath = `components/base-ds-icons/${entrypoint}.ts`;
  const files = paths
    .filter((path) => path !== iconBarrel)
    .map((path) => {
      const file = registryFile(path);
      if (iconExports.length === 0) return file;

      const content = readFileSync(join(root, path), 'utf8');
      if (!content.includes('@/components/icons')) return file;
      const generatedPath = `${generatedRoot}/${entrypoint}/${path}.source`;
      mkdirSync(dirname(join(root, generatedPath)), { recursive: true });
      writeFileSync(
        join(root, generatedPath),
        content.replaceAll('@/components/icons', `@/components/base-ds-icons/${entrypoint}`),
      );
      return {
        path: generatedPath,
        type: 'registry:file',
        target: path,
      };
    });

  if (iconExports.length > 0) {
    const generatedPath = `${generatedRoot}/${entrypoint}/icons.ts.source`;
    mkdirSync(dirname(join(root, generatedPath)), { recursive: true });
    writeFileSync(
      join(root, generatedPath),
      `export {\n  ${iconExports.join(',\n  ')},\n} from '@carbon/icons-react';\n`,
    );
    files.push({
      path: generatedPath,
      type: 'registry:file',
      target: iconModulePath,
    });
  }

  return files;
}

function versionedDependencies(names) {
  return names.map((name) => packageVersions[name] ? `${name}@${packageVersions[name]}` : name);
}

const entries = [...contract.components, ...contract.patterns];
const individualItems = entries.map(({ entrypoint }) => {
  const closure = dependencyClosure([sourcePath(entrypoint)]);
  return {
    name: entrypoint,
    type: 'registry:ui',
    title: entrypoint.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
    description: `The base-ds ${entrypoint} component, adapted to semantic tokens and Carbon icons.`,
    dependencies: versionedDependencies(closure.dependencies),
    registryDependencies: [tokenRegistryUrl],
    files: individualFiles(entrypoint, closure.files),
  };
});

const tokenItem = {
  name: 'base-ds-tokens',
  type: 'registry:style',
  title: 'base-ds tokens',
  description: 'The immutable base-ds primitive and semantic tokens, merged into the project stylesheet without replacing its global styles.',
  files: tokenFiles.map(registryFile),
  css: {
    '@import "@/tokens/primitives.css"': {},
    '@import "@/tokens/semantic.css"': {},
  },
};

const complete = dependencyClosure(entries.map(({ entrypoint }) => sourcePath(entrypoint)));
const baseItem = {
  name: 'base-ds',
  type: 'registry:base',
  title: 'base-ds',
  description: 'The complete Radix-first base-ds component library, semantic tokens, Carbon icons, and agent-safe component contract.',
  dependencies: versionedDependencies(complete.dependencies),
  registryDependencies: [tokenRegistryUrl],
  files: complete.files.map(registryFile),
  style: 'radix-nova',
  baseColor: 'neutral',
};

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'base-ds',
  homepage: 'https://github.com/henrikhellstromgbg/base-ds',
  items: [tokenItem, baseItem, ...individualItems],
};

writeFileSync(join(root, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Generated registry.json with ${registry.items.length} items.`);
