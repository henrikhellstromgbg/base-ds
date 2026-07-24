# Agent instructions (Codex and other agents)

Before any UI work: read `design-rules/RULES.md` in full. It is the single
source of truth for design rules. Then read `CLAUDE.md` for architecture and
workflow; everything in it applies to you as well.

Non-negotiable summary:

- Compose views from `components/ui/` only. Never create components in views.
- Colors via `--color-*` semantic tokens only. Never hex/rgb/hsl/raw oklch.
- Font floor 14px. No `text-xs`, no arbitrary smaller sizes.
- No uppercase. No em/en-dashes in copy. Sentence case everywhere.
- Icons from `@carbon/icons-react` only.
- Run `npm run design-check` before finishing any UI task and fix all hits.
- Before styling any new UI, check components/ui/README.md for an existing
  component and RULES.md for constraints. If neither covers the case, stop and
  ask instead of inventing.
