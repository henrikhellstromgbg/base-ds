# Base design system

This project uses a locked design system. Your job when building UI is
composition, not invention. The design decisions are already made.

## The one rule that governs everything

@design-rules/RULES.md

Read it before any UI work. Every rule applies to every file, every session.
When a rule conflicts with your instinct, the rule wins. Never improvise a
one-off component, color, or font size.

Before styling any new UI, check components/ui/README.md for an existing
component and RULES.md for constraints. If neither covers the case, stop and
ask instead of inventing.

`design-system/registry.json` is the machine-readable source of truth for
supported components, page patterns, and their allowed import surfaces. Keep
it synchronized when the component inventory changes.

Before building any new view, flow, or overlay, and before adding any form,
read the ux-patterns skill (`.claude/skills/ux-patterns/SKILL.md`). It decides
which surface a thing belongs on and which control fits the data. This carries
the same weight as the stop-and-ask rule above: RULES.md says how it should
look, ux-patterns says what shape it should take.

## Architecture

- `tokens/primitives.css` — raw OKLCH values, APCA-verified. Never edit, never reference from components.
- `tokens/semantic.css` — the only color layer components may use (`--color-*`). Never edit in a project.
- `tokens/theme.css` — project brand overrides. The ONLY token file that differs between projects.
- `design-system/registry.json` — machine-readable contract for supported components and page patterns.
- `components/ui/` — the complete component library. Views are built from these and nothing else.
- `components/icons.ts` — re-exports from `@carbon/icons-react`. Import icons from here.
- `examples/` — correctly built reference views. When unsure how something should look, look here first.
- `design-rules/RULES.md` — all rules, numbered. Machine-checked rules are tagged `[lint]`.

## Workflow for UI tasks

1. Read RULES.md (via the import above).
2. For a new view, flow, overlay, or form: read the ux-patterns skill and pick the surface and controls from it before writing any markup.
3. Check `components/ui/` and `examples/` for existing patterns.
4. Confirm the component or pattern is registered in `design-system/registry.json`.
5. Build views by composing existing components. Layout with div/flex/grid using `--space-*` tokens.
6. Before declaring done: run `npm run design-check`. Fix every violation.
7. If you changed or added any color pairing: run `npm run contrast-check`.
8. For a full review, use the design-review skill.

## Verification commands

- `npm run design-check` — greps for [lint] rule violations. Must pass.
- `npm run contrast-check` — APCA verification of theme brand pairs. Must pass after theme changes.
- `npm run verify-scales` — verifies the complete rendered APCA scale matrix.

## Hard boundaries (short version, full text in RULES.md)

- Font floor is 14px. `text-xs` does not exist here.
- No uppercase, ever.
- No em-dashes or en-dashes in copy.
- Colors come from `--color-*` semantic tokens. No hex, rgb, hsl, or raw oklch in components/views.
- Icons come from `@carbon/icons-react` only.
- New components require the new-component skill process, never ad hoc creation in a view.
- Sentence case in all UI copy.

## Language

Code, comments, and commit messages in English. UI copy language is decided
per project (check the project's own notes; Swedish products use Swedish copy
with sentence case and no dashes per N3/N10).
