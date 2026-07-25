#!/usr/bin/env bash
# Usage: ./scripts/adopt.sh /path/to/existing-project
# Retrofits base-ds into an EXISTING project: tokens, registry, inventory,
# RULES.md, skills, and checks.
# Never overwrites existing files (skips and warns). Appends a marked section to
# CLAUDE.md/AGENTS.md instead of replacing them. Idempotent: safe to run twice.
set -euo pipefail

DEST_ARG="${1:?Usage: adopt.sh /path/to/existing-project}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$(cd "$DEST_ARG" 2>/dev/null && pwd || true)"

if [ -z "$DEST" ] || [ ! -d "$DEST" ]; then
  echo "Error: target directory '$DEST_ARG' does not exist." >&2
  exit 1
fi
if [ "$DEST" = "$SRC" ]; then
  echo "Error: target is base-ds itself; nothing to adopt." >&2
  exit 1
fi

# --- Files to install (source paths relative to SRC) -------------------------
FILES=(
  "tokens/primitives.css"
  "tokens/semantic.css"
  "tokens/theme.css"
  "design-system/registry.json"
  "design-rules/RULES.md"
  "components/ui/README.md"
  "scripts/design-check.mjs"
  "scripts/contrast-check.mjs"
  "tools/generate-scales.mjs"
  "MIGRATING.md"
)
# Install every supported agent skill surface. Each destination remains
# independently user-owned: an existing Claude or Codex skill is never replaced.
for skill_root in ".claude/skills" ".codex/skills"; do
  while IFS= read -r f; do
    FILES+=("${f#"$SRC"/}")
  done < <(find "$SRC/$skill_root" -type f | sort)
done

COPIED=()
SKIPPED=()

for rel in "${FILES[@]}"; do
  src="$SRC/$rel"
  dst="$DEST/$rel"
  if [ ! -e "$src" ]; then
    echo "Warning: source missing, skipping $rel" >&2
    continue
  fi
  if [ -e "$dst" ]; then
    SKIPPED+=("$rel")
    continue
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  COPIED+=("$rel")
done

# --- npm scripts + devDependency detection (via node, already required) ------
SCRIPTS_ADDED=""
SCRIPTS_PRESENT=""
DEPS_MISSING="typescript apca-w3 colorparsley culori"
PKG_NOTE=""

if [ -f "$DEST/package.json" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_OUT="$(node -e '
      const fs = require("fs");
      const p = process.argv[1];
      let raw = fs.readFileSync(p, "utf8");
      let pkg;
      try { pkg = JSON.parse(raw); } catch (e) { console.log("PARSE_ERROR:"); process.exit(0); }
      const want = {
        "design-check": "node scripts/design-check.mjs",
        "contrast-check": "node scripts/contrast-check.mjs",
        "verify-scales": "node tools/generate-scales.mjs",
      };
      const scripts = pkg.scripts || {};
      const added = [], present = [];
      for (const [k, v] of Object.entries(want)) (k in scripts ? present : added).push(k);
      if (added.length) {
        if (Object.keys(scripts).length === 0) {
          pkg.scripts = pkg.scripts || {};
          for (const k of added) pkg.scripts[k] = want[k];
          fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
        } else {
          const indent = (raw.match(/"scripts"\s*:\s*\{\s*\n([ \t]+)"/) || [, "    "])[1];
          const ins = added.map(k => `${indent}"${k}": "${want[k]}",`).join("\n");
          raw = raw.replace(/("scripts"\s*:\s*\{)/, `$1\n${ins}`);
          fs.writeFileSync(p, raw);
        }
      }
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const missing = ["typescript", "apca-w3", "colorparsley", "culori"].filter(d => !(d in deps));
      console.log("ADDED:" + added.join(" "));
      console.log("PRESENT:" + present.join(" "));
      console.log("DEPS_MISSING:" + missing.join(" "));
    ' "$DEST/package.json")"

    if printf '%s\n' "$NODE_OUT" | grep -q '^PARSE_ERROR:'; then
      PKG_NOTE="package.json could not be parsed; add the scripts manually."
    else
      SCRIPTS_ADDED="$(printf '%s\n' "$NODE_OUT" | sed -n 's/^ADDED://p')"
      SCRIPTS_PRESENT="$(printf '%s\n' "$NODE_OUT" | sed -n 's/^PRESENT://p')"
      DEPS_MISSING="$(printf '%s\n' "$NODE_OUT" | sed -n 's/^DEPS_MISSING://p')"
    fi
  else
    PKG_NOTE="node not found; add the design-check/contrast-check/verify-scales scripts manually."
  fi
else
  PKG_NOTE="no package.json in target; create one and add the three check scripts."
fi

# --- Append marked section to CLAUDE.md / AGENTS.md --------------------------
MARKER="<!-- base-ds:adopt -->"
DOC_RESULT=()

append_section() {
  local file="$1"
  local path="$DEST/$file"
  if [ -f "$path" ] && grep -qF "$MARKER" "$path"; then
    DOC_RESULT+=("$file: already has base-ds section (skipped)")
    return
  fi
  local verb="appended to"
  [ -f "$path" ] || verb="created"
  cat >> "$path" <<'EOF'

<!-- base-ds:adopt -->
## base-ds design system

This project uses base-ds for its UI. The design decisions are already made;
your job is composition, not invention.

- Machine contract: `design-system/registry.json` (supported components and patterns).
- Constraints: `design-rules/RULES.md` (numbered rules, single source of truth).
- Components: `components/ui/README.md` (the human-readable inventory).
- Patterns: `.claude/skills/ux-patterns/SKILL.md` for Claude Code and
  `.codex/skills/ux-patterns/SKILL.md` for Codex (which surface, which control).
- Checks: `npm run design-check`, `npm run contrast-check`, `npm run verify-scales`.
- Upgrades: `MIGRATING.md` (one section per breaking change in base-ds).

Before styling any new UI, check components/ui/README.md for an existing
component and RULES.md for constraints. If neither covers the case, stop and
ask instead of inventing.

Before building any new view, flow, or overlay, and before adding any form,
read the ux-patterns skill for the agent you are using. RULES.md governs how UI
looks; ux-patterns governs what shape it takes. Same standing as the
stop-and-ask rule above.
<!-- /base-ds:adopt -->
EOF
  DOC_RESULT+=("$file: base-ds section $verb")
}

append_section "CLAUDE.md"
append_section "AGENTS.md"

# --- Summary -----------------------------------------------------------------
echo
echo "Adopted base-ds into $DEST"
echo

echo "Copied (${#COPIED[@]}):"
if [ "${#COPIED[@]}" -eq 0 ]; then
  echo "  (nothing — everything already present)"
else
  for f in "${COPIED[@]}"; do echo "  + $f"; done
fi
echo

if [ "${#SKIPPED[@]}" -gt 0 ]; then
  echo "Skipped, already existed — resolve conflicts manually (${#SKIPPED[@]}):"
  for f in "${SKIPPED[@]}"; do echo "  ! $f"; done
  echo
fi

echo "package.json:"
if [ -n "$PKG_NOTE" ]; then
  echo "  $PKG_NOTE"
else
  [ -n "$SCRIPTS_ADDED" ]   && echo "  added scripts:   $SCRIPTS_ADDED"   || echo "  added scripts:   (none)"
  [ -n "$SCRIPTS_PRESENT" ] && echo "  already present: $SCRIPTS_PRESENT"
fi
echo

echo "Docs:"
for r in "${DOC_RESULT[@]}"; do echo "  $r"; done
echo

echo "Next steps:"
n=1
if [ -n "$DEPS_MISSING" ]; then
  echo "  $n. Install check dependencies:"
  echo "       npm install -D $DEPS_MISSING"
  n=$((n + 1))
fi
echo "  $n. Edit tokens/theme.css with this project's brand colors (OKLCH)."; n=$((n + 1))
echo "  $n. Make sure your global stylesheet imports the token files"
echo "       (primitives.css, semantic.css, theme.css); contrast-check expects"
echo "       app/globals.css to '@import ../tokens/theme.css;'."; n=$((n + 1))
echo "  $n. Run: npm run contrast-check && npm run design-check"
