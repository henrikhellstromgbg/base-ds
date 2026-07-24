# base-ds

A locked, APCA-verified design system for shipping accessible product
interfaces. It combines OKLCH tokens, Radix-based components, Carbon
icons, machine-enforced design rules, and agent guidance for Codex and Claude.

## Three ways to use this repo

### 1. New project

Start from base-ds as the foundation. `new-project.sh` copies everything and
sets up a fresh theme file.

## Three ways to use this repo

base-ds works in three scenarios. Pick the one that matches your situation.

### 1. New project, no design direction yet

Use the script. Everything (CLAUDE.md, AGENTS.md, RULES.md, skills, checks)
is copied in, so Claude Code and Codex are constrained from the first prompt.
No special prompt needed.

    ./scripts/new-project.sh my-project
    cd ~/sites/my-project
    npm install
    npm run contrast-check
    npm run build

The agent will ask for a brand direction (colors, fonts, mood) before
building UI, and it goes into tokens/theme.css. The agent must not invent
a brand on its own.

### 2. Existing project with an established design

The project already has a look (colors, fonts) that must survive the
migration. The design system is adopted underneath the current design,
not instead of it. Give the agent this prompt:

    This project should adopt my design system base-ds
    (https://github.com/henrikhellstromgbg/base-ds).

    Phase 1, install: copy tokens/, design-rules/RULES.md, .claude/skills/,
    and the check scripts (design-check, contrast-check, verify-scales)
    from base-ds into this repo. Add the npm scripts. Reference RULES.md
    from this project's existing CLAUDE.md, don't overwrite it.

    Phase 2, audit only, no changes yet: extract this project's current
    design direction. Inventory the actual colors, fonts, spacing, and
    radii in use. Convert the brand colors to OKLCH and draft a
    tokens/theme.css that preserves this project's existing look. Run
    contrast-check on it. If any current color fails APCA, do NOT silently
    change it: report which color, on which surface, by how much, and
    propose the smallest adjustment that passes. I decide. Then run
    design-check and inventory every violation. Report as a prioritized
    list and stop.

    Phase 3, after my approval: migrate incrementally, one area at a time,
    running design-check and contrast-check after each step. Brand colors
    live in tokens/theme.css only, primitives.css and semantic.css are
    never edited. The goal is that the app looks the same as today (modulo
    approved contrast fixes), but built on the token system. Visual drift
    is a bug, not an improvement. Do not modernize or restyle anything
    beyond mapping existing styles to tokens.

### 3. Existing project without an established design

Same prompt as scenario 2, but replace phase 2's extraction with a design
direction conversation: the agent proposes 2-3 brand directions (colors in
OKLCH, font pairing, mood), you pick one, it goes into tokens/theme.css,
and the migration maps existing UI onto that direction instead of
preserving the old look.

### The rule that makes all three work

In every scenario, the agent checks components/ui/README.md for an
existing component and RULES.md for constraints before styling any new
UI. If neither covers the case, it stops and asks instead of inventing.
That line lives in CLAUDE.md and AGENTS.md, and it is what prevents
design drift mid-project.

The copy includes CLAUDE.md, AGENTS.md, RULES.md, skills, and scripts, so
Claude Code and Codex are constrained from the first prompt.

### 2. Existing project with an established design

The project already has a look you want to keep. Adopt the system, capture the
current brand into tokens, then migrate incrementally without visual drift.
`adopt.sh` installs base-ds without overwriting anything: it copies tokens,
RULES.md, skills, and the checks, adds the npm scripts, and appends a base-ds
section to CLAUDE.md/AGENTS.md. Existing files are skipped and reported.

Run a three-phase migration prompt with the agent:

```
Phase 1 — install (no visual changes)
Run ./scripts/adopt.sh /path/to/this/project, then npm install -D the check
dependencies it lists. Wire the token files into the global stylesheet
(@import primitives.css, semantic.css, theme.css). Do not restyle anything yet.

Phase 2 — audit only (no visual changes)
Extract the project's current brand into tokens/theme.css as OKLCH values:
brand colors, surfaces, fonts, radii, spacing. Do not touch any component or
view. Produce an APCA report: run npm run contrast-check and npm run
verify-scales, and list every pairing that fails a tier in RULES.md. Output is
a report plus a filled-in theme.css, nothing else.

Phase 3 — incremental migration
Migrate one view at a time onto components/ui and the semantic tokens. The
established design is the spec: visual drift from it is a bug, not a license to
redesign. After each view, run npm run design-check and npm run contrast-check
and fix every hit. If a needed component or token does not exist, stop and ask.
```

### 3. Existing project without an established design

Same as scenario 2, but there is no design worth preserving. The only change is
phase 2: instead of extracting one brand, the agent proposes 2-3 brand
directions (color, type, density) for you to choose from, and the chosen one
becomes tokens/theme.css. Phases 1 and 3 are identical.

```
Phase 2 — propose a direction (no visual changes)
There is no established design to keep. Propose 2-3 distinct brand directions
as OKLCH theme.css drafts (brand, surfaces, fonts, radii). For each, note the
intended feel and confirm it passes contrast-check. I pick one; that draft
becomes the active tokens/theme.css. Then continue to phase 3.
```

## Daily commands

| Command | What it does |
|---|---|
| `npm run design-check` | Machine check of all `[lint]` rules in RULES.md |
| `npm run contrast-check` | APCA verification of 46 rendered theme-brand pairs |
| `npm run verify-scales` | Verify the full rendered APCA matrix, parsed from primitives.css and semantic.css |
| `npm run build` | Production Next.js build (the repo is a runnable starter) |

## Add or change a rule

Edit `design-rules/RULES.md`, one line, next number in the right section.
It is immediately active in Claude Code, Codex, and the design-review skill.
If the rule is mechanically checkable, also add a matcher in
`scripts/design-check.mjs` and tag the rule `[lint]`.

## Add a component

Use the new-component skill in Claude Code ("add a Select component to the
design system"). It follows the gates: composition check, approval, build to
standard, verify, document in `components/ui/README.md`. Generally useful
components get copied back here so all future projects inherit them.

## Architecture summary

```
tokens/primitives.css   raw OKLCH values (APCA-verified) — never edited in projects
tokens/semantic.css     --color-* layer, light + dark — never edited in projects
tokens/theme.css        per-project brand — the ONLY file that varies
components/ui/          the library (inventory in its README.md)
components/icons.ts     Carbon icon barrel — the only icon import path
design-rules/RULES.md   all rules, single source of truth
.claude/skills/         design-review, new-component, a11y-audit
scripts/                design-check, contrast-check, new-project, adopt
tools/                  color scale generator with APCA verification
examples/               reference views showing correct composition
```

## APCA contrast tiers (what is verified, precisely)

| Tier | Min Lc | Verified against |
|---|---|---|
| Primary text | 90 | all six semantic surfaces, both modes |
| Body text (secondary, status text, links) | 75 | all six semantic surfaces; status text is also checked on its status background, both modes |
| Meta text (tertiary: hints, timestamps, placeholders) | 60 | four static surfaces only (canvas/surface/raised/sunken); NOT permitted on hover/active (rule A13) and never body copy |
| Non-text UI (icons, status indicators) | 45 | canvas + surface, both modes |
| Input/control borders (border-strong) | 30 | surface, both modes; borders are never the sole affordance (filled bg + visible label, rule N8) |
| Decorative uses of border-subtle | exempt | only when the border is non-essential and another visual affordance identifies the grouping; reported informationally |

`npm run verify-scales` runs the full 114-pair base matrix. It resolves the
rendered pairings from both `tokens/primitives.css` and `tokens/semantic.css`,
including duplicated semantic surfaces that currently share a primitive.
`npm run contrast-check` separately resolves the active `tokens/theme.css`
through the same semantic chain and checks the states consumed by buttons,
selected rows, and focus rings. Run both commands in CI or pre-commit.
