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

## Architecture

- `tokens/primitives.css` — raw OKLCH values, APCA-verified. Never edit, never reference from components.
- `tokens/semantic.css` — the only color layer components may use (`--color-*`). Never edit in a project.
- `tokens/theme.css` — project brand overrides. The ONLY token file that differs between projects.
- `components/ui/` — the complete component library. Views are built from these and nothing else.
- `components/icons.ts` — re-exports from `@carbon/icons-react`. Import icons from here.
- `examples/` — correctly built reference views. When unsure how something should look, look here first.
- `design-rules/RULES.md` — all rules, numbered. Machine-checked rules are tagged `[lint]`.

## Workflow for UI tasks

1. Read RULES.md (via the import above).
2. Check `components/ui/` and `examples/` for existing patterns.
3. Build views by composing existing components. Layout with div/flex/grid using `--space-*` tokens.
4. Before declaring done: run `npm run design-check`. Fix every violation.
5. If you changed or added any color pairing: run `npm run contrast-check`.
6. For a full review, use the design-review skill.

## Verification commands

- `npm run design-check` — greps for [lint] rule violations. Must pass.
- `npm run contrast-check` — APCA verification of theme brand pairs. Must pass after theme changes.

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
