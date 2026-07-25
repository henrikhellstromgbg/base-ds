# Agent instructions (Codex and other agents)

Before any UI work: read `design-rules/RULES.md` in full. It is the single
source of truth for design rules. Then read `CLAUDE.md` for architecture and
workflow; everything in it applies to you as well.

Treat `design-system/registry.json` as the machine-readable contract for
supported components, page patterns, and import surfaces. Keep it synchronized
with `components/ui/README.md` when the inventory changes.

Non-negotiable summary:

- Compose views from `components/ui/` only. Never create components in views.
- Colors via `--color-*` semantic tokens only. Never hex/rgb/hsl/raw oklch.
- Font floor 14px. No `text-xs`, no arbitrary smaller sizes.
- No uppercase. No em/en-dashes in copy. Sentence case everywhere.
- Icons from `@/components/icons` only; that barrel owns the approved Carbon set.
- Run `npm run design-check` before finishing any UI task and fix all hits.
- Before styling any new UI, check components/ui/README.md for an existing
  component and RULES.md for constraints. If neither covers the case, stop and
  ask instead of inventing.
- Before building any new view, flow, or overlay, and before adding any form,
  read `.codex/skills/ux-patterns/SKILL.md`. It decides which surface the
  thing belongs on and which control fits the data. Same standing as the
  stop-and-ask rule: RULES.md governs how it looks, ux-patterns governs what
  shape it takes.
