# base-ds

A locked, APCA-verified design system for shipping accessible product
interfaces. It combines OKLCH tokens, shadcn-architecture components reskinned
onto those tokens, Carbon icons, machine-enforced design rules, and agent
guidance for Codex and Claude.

## Three ways to use this repo

### 1. New project

Start from base-ds as the foundation. `new-project.sh` copies everything and
sets up a fresh theme file.

```bash
./scripts/new-project.sh my-project
cd ~/sites/my-project
npm install
# Edit the active tokens/theme.css (brand colors in OKLCH, fonts)
npm run contrast-check
npm run build
```

The copy includes CLAUDE.md, AGENTS.md, the machine-readable registry,
RULES.md, skills for both `.claude/` and `.codex/`, and the check scripts, so
Claude Code and Codex are constrained from the first prompt.

### 2. Existing project with an established design

The project already has a look you want to keep. Adopt the system, capture the
current brand into tokens, then migrate incrementally without visual drift.
`adopt.sh` installs base-ds without overwriting anything: it copies tokens,
the registry, the component inventory, RULES.md, skills into both `.claude/`
and `.codex/`, MIGRATING.md, and the checks. It also adds missing npm scripts
and appends a base-ds section to CLAUDE.md/AGENTS.md. Existing files are
skipped and reported.

`adopt.sh` deliberately installs no component source. It installs
`components/ui/README.md` only as the inventory. A project being retrofitted
already has its own components, and overwriting them would break every view at once
instead of one at a time. Phase 3 is where components arrive: copy the ones a
view needs from base-ds `components/ui/` by hand as you migrate that view, and
retire the project's equivalent when the last caller is gone. The inventory in
`components/ui/README.md` is the list to copy from.

Run a three-phase migration prompt with the agent:

```
Phase 1 — install (no visual changes)
Run ./scripts/adopt.sh /path/to/this/project, then npm install -D the check
dependencies it lists. Wire the token files into the global stylesheet
(@import primitives.css, semantic.css, theme.css). Do not restyle anything yet.

Phase 2 — audit only (no visual changes)
Extract the project's current brand into tokens/theme.css as OKLCH values:
brand colors, surfaces, fonts, radii, spacing. Identify the action color
(filled buttons, primary CTAs) separately from the brand accent; they are often
not the same color. Map action to --color-action, brand to --color-brand. Do
not touch any component or view. Produce an APCA report: run npm run
contrast-check and npm run verify-scales, and list every pairing that fails a
tier in RULES.md. Output is a report plus a filled-in theme.css, nothing else.
Then STOP and wait for my approval before phase 3.

Phase 3 — incremental migration
Only after explicit approval: migrate one view at a time onto components/ui and
the semantic tokens. The established design is the spec: visual drift from it
is a bug, not a license to redesign. After each view, run npm run design-check
and npm run contrast-check and fix every hit. If a needed component or token
does not exist, stop and ask. When all views are migrated, retire the project's
legacy color definitions (old :root and @theme blocks) so the tokens are the
only source.
```

### 3. Existing project without an established design

Same as scenario 2, but there is no design worth preserving. The only change is
phase 2: instead of extracting one brand, the agent proposes 2-3 brand
directions (color, type, density) for you to choose from, and the chosen one
becomes tokens/theme.css. Phases 1 and 3 are identical.

```
Phase 2 — propose a direction (no visual changes)
There is no established design to keep. Propose 2-3 distinct brand directions
as OKLCH theme.css drafts (brand, surfaces, fonts, radii). In each draft, keep
the action color (filled buttons, primary CTAs) separate from the brand accent;
they are often not the same color. Map action to --color-action, brand to
--color-brand. For each direction, note the intended feel and confirm it passes
contrast-check. Then STOP and wait for my approval before phase 3: I pick one,
and that draft becomes the active tokens/theme.css.
```

## Daily commands

| Command | What it does |
|---|---|
| `npm test` | Run design-check regressions and the adoption smoke test |
| `npm run design-check` | Machine check of all `[lint]` rules in RULES.md |
| `npm run contrast-check` | APCA verification of 46 rendered theme-brand pairs |
| `npm run verify-scales` | Verify the full rendered APCA matrix, parsed from primitives.css and semantic.css |
| `npm run registry:build` | Regenerate and validate the installable shadcn registry in `public/r/` |
| `npm run build` | Production Next.js build (the repo is a runnable starter) |

## Add or change a rule

Edit `design-rules/RULES.md`, one line, next number in the right section.
It is immediately active in Claude Code, Codex, and the design-review skill.
If the rule is mechanically checkable, also add a matcher in
`scripts/design-check.mjs` and tag the rule `[lint]`.

## Add a component

Use the new-component skill in Claude Code or Codex ("add a Select component
to the design system"). It follows the gates: composition check, approval,
build to standard, verify, document in `components/ui/README.md`, and update
`design-system/registry.json`. Generally useful components get copied back
here so all future projects inherit them.

### Where components come from

`components/ui/` follows shadcn/ui architecture: a Radix primitive underneath,
`class-variance-authority` for variants, `cn` (clsx + tailwind-merge) for class
merging, and the component owned as source in this repo rather than pulled from
a package. What is not shadcn is the skin. Every color, size, radius, shadow,
and duration is a semantic token, so the components inherit the theme and stay
APCA-verified.

The adapted catalog is checked into `components/ui/`, so agents do not need to
generate common controls. Two upstream entries intentionally use the base-ds
equivalent instead: the deprecated toast component is replaced by Sonner and
`Toaster`, and the upstream form guide is represented by `FormField` and
`Field` rather than a separate `form` entrypoint. `components.json` keeps the project
compatible with the shadcn CLI and selects the Radix Nova base. The CLI schema
does not offer Carbon as an icon-library value, so that compatibility field is
`lucide`; it does not describe the source contract. Every checked-in component
uses Carbon through `components/icons.ts`, and `design-check` rejects Lucide
imports.

To install the complete system into another shadcn project, use the generated
base item:

```bash
npx shadcn add https://raw.githubusercontent.com/henrikhellstromgbg/base-ds/main/public/r/base-ds.json
```

Individual items are available at the same path, for example
`public/r/combobox.json`. Every install depends on the generated
`base-ds-tokens` style item. The shadcn CLI merges imports for
`tokens/primitives.css` and `tokens/semantic.css` into the configured global
stylesheet, preserving the project's existing global rules. Registry installs
never include `tokens/theme.css`, because that file belongs to the consuming
project.

Individual items also generate an item-scoped Carbon icon module containing
only the icons required by that item's dependency closure. They do not install
or replace the full `components/icons.ts` barrel. The complete `base-ds` item
still includes that barrel because it installs the complete system.

`registry.json` is generated from the machine-readable component contract, and
`npm run registry:build` validates every item with the official shadcn CLI. Do
not run `npx shadcn add` against the upstream catalog inside base-ds: upstream
output uses its own palette and Lucide icons. Update the adapted source here,
sync the contract, then rebuild this registry.

## Architecture summary

```
tokens/primitives.css   raw OKLCH values (APCA-verified) — never edited in projects
tokens/semantic.css     --color-* layer, light + dark — never edited in projects
tokens/theme.css        per-project brand — the ONLY file that varies
design-system/registry.json  machine contract for supported components and patterns
registry.json           generated shadcn registry source, built to public/r/
components.json         shadcn CLI configuration, Radix Nova base
components/ui/          the library (inventory in its README.md)
components/icons.ts     Carbon icon barrel — the only icon import path
design-rules/RULES.md   all rules, single source of truth
.claude/skills/         design-review, new-component, a11y-audit, ux-patterns
.codex/skills/          the same skills, discoverable by Codex
scripts/                design-check, contrast-check, new-project, adopt
tools/                  color scale generator with APCA verification
examples/               reference views showing correct composition
MIGRATING.md            what to do when a project adopted an older base-ds
```

`MIGRATING.md` has one section per breaking change, newest first. A project
that adopted before a change applies every section newer than its adoption
date. It also documents how to resync a project forward in general.

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
