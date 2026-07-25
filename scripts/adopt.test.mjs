import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const adoptScript = join(repoRoot, "scripts", "adopt.sh");

function makeTarget() {
  const target = mkdtempSync(join(tmpdir(), "base-ds-adopt-"));
  mkdirSync(join(target, "tokens"), { recursive: true });
  writeFileSync(join(target, "tokens", "theme.css"), "/* user-owned theme */\n");
  writeFileSync(
    join(target, "package.json"),
    JSON.stringify({ name: "adopt-fixture", private: true, scripts: { test: "node --test" } }, null, 2) + "\n",
  );
  writeFileSync(join(target, "CLAUDE.md"), "# Existing Claude instructions\n");
  writeFileSync(join(target, "AGENTS.md"), "# Existing Codex instructions\n");
  return target;
}

function adopt(target) {
  return execFileSync("bash", [adoptScript, target], { encoding: "utf8" });
}

test("adopt installs a self-contained control plane without overwriting files", () => {
  const target = makeTarget();
  const firstRun = adopt(target);

  assert.equal(readFileSync(join(target, "tokens", "theme.css"), "utf8"), "/* user-owned theme */\n");
  assert.match(firstRun, /Skipped, already existed/);

  const requiredFiles = [
    "design-system/registry.json",
    "design-rules/RULES.md",
    "components/ui/README.md",
    "scripts/design-check.mjs",
    "scripts/contrast-check.mjs",
    "tools/generate-scales.mjs",
    "MIGRATING.md",
  ];
  const skillNames = ["a11y-audit", "design-review", "new-component", "ux-patterns"];
  for (const skillName of skillNames) {
    requiredFiles.push(`.claude/skills/${skillName}/SKILL.md`);
    requiredFiles.push(`.codex/skills/${skillName}/SKILL.md`);
  }
  for (const relativePath of requiredFiles) {
    assert.doesNotThrow(
      () => readFileSync(join(target, relativePath), "utf8"),
      `expected adoption to install ${relativePath}`,
    );
  }

  for (const agentFile of ["CLAUDE.md", "AGENTS.md"]) {
    const instructions = readFileSync(join(target, agentFile), "utf8");
    assert.match(instructions, /design-system\/registry\.json/);
    assert.match(instructions, /components\/ui\/README\.md/);
    assert.match(instructions, /\.claude\/skills\/ux-patterns\/SKILL\.md/);
    assert.match(instructions, /\.codex\/skills\/ux-patterns\/SKILL\.md/);
  }

  const packageJson = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.test, "node --test");
  assert.equal(packageJson.scripts["design-check"], "node scripts/design-check.mjs");
  assert.equal(packageJson.scripts["contrast-check"], "node scripts/contrast-check.mjs");
  assert.equal(packageJson.scripts["verify-scales"], "node tools/generate-scales.mjs");
});

test("adopt is idempotent and reports the second run as skipped", () => {
  const target = makeTarget();
  adopt(target);
  const before = new Map(
    ["CLAUDE.md", "AGENTS.md", "package.json", "tokens/theme.css"].map((file) => [
      file,
      readFileSync(join(target, file), "utf8"),
    ]),
  );

  const secondRun = adopt(target);

  assert.match(secondRun, /nothing.*everything already present/i);
  assert.match(secondRun, /already has base-ds section \(skipped\)/);
  for (const [file, contents] of before) {
    assert.equal(readFileSync(join(target, file), "utf8"), contents, `${file} changed on the second run`);
  }
});
