# Migrating between base-ds versions

One section per breaking change, newest first. If a project adopted base-ds
before a change listed here, apply the section.

## 1.2.0: primary → action, accent → brand

### Why

The old names ranked colors instead of naming their job. "Primary" reads as
"the main brand color", so a brand color gets mapped onto `--color-primary`,
and every filled button in the product turns brand red. That happened for
real in the first adoption.

The two roles are separate and usually different colors:

- **action**: filled buttons and primary CTAs. What the user clicks.
- **brand**: the brand's identity color. Selection tints, highlights.

### What changed

| Old | New | Layer |
|---|---|---|
| `--brand-primary` | `--brand-action` | theme.css |
| `--brand-primary-hover` | `--brand-action-hover` | theme.css |
| `--brand-primary-text` | `--brand-action-text` | theme.css |
| `--brand-accent` | `--brand-base` | theme.css |
| `--brand-accent-subtle` | `--brand-base-subtle` | theme.css |
| `--color-primary` | `--color-action` | semantic.css |
| `--color-primary-hover` | `--color-action-hover` | semantic.css |
| `--color-primary-text` | `--color-action-text` | semantic.css |
| `--color-accent` | `--color-brand` | semantic.css |
| `--color-accent-subtle` | `--color-brand-subtle` | semantic.css |

`--color-text-primary` is unrelated and does **not** change. It names a text
hierarchy tier, not a brand role.

Component APIs do not change either. `<Button variant="primary">` still means
"the filled one" and keeps its name.

### How to apply

From the project root, after copying the new token files in:

```sh
FILES=$(grep -rl -- '--brand-primary\|--brand-accent\|--color-primary\|--color-accent' \
  app components examples lib tokens scripts tools 2>/dev/null)

for f in $FILES; do
  sed -i '' \
    -e 's/--brand-primary/--brand-action/g' \
    -e 's/--brand-accent/--brand-base/g' \
    -e 's/--color-primary/--color-action/g' \
    -e 's/--color-accent/--color-brand/g' \
    "$f"
done
```

The four patterns do not overlap, so order does not matter, and
`--color-text-primary` is left alone because it does not contain the literal
string `--color-primary`.

Then verify:

```sh
grep -rn -- '--color-primary\|--color-accent' app components examples lib tokens
npm run design-check
npm run contrast-check
```

The grep must return nothing. If `contrast-check` fails, the project mapped a
brand color onto the action slot: split them per the table above rather than
loosening the threshold.

### While you are in there

If the project has a themed action color that is really the brand color, this
is the moment to fix it. Pick the action color from what reads as clickable,
and put the brand color on `--brand-base`.

---

## Syncing a project forward, in general

Adoption is a copy, not a package install, so a project drifts from base-ds
the moment either side changes. To resync:

1. Re-run `scripts/adopt.sh` from base-ds against the project. It refreshes
   tokens, rules, skills and checks, and skips anything it would clobber.
2. Copy the components that changed by hand. `adopt.sh` does not install
   `components/ui/`, by design: a project that already has its own components
   should retire them view by view, not have them overwritten.
3. Apply every section above that is newer than the project's adoption.
4. Run `design-check`, `contrast-check`, and the build.

### Worked example: Trove, adopted at 1.1.0

Trove needs, in order:

1. The 1.2.0 rename, exactly as scripted above.
2. Re-copy the five components that were synced back into base-ds from Trove
   itself: `status-indicator`, `data-list`, `tabs`, `alert-dialog`, `select`.
   The base-ds versions are the newer ones now, they gained the row padding
   fix and explicit `cursor-pointer`.
3. `cursor-pointer` on any remaining interactive element the project owns.
   Tailwind v4's preflight sets buttons to `cursor: default`, so this is not
   optional and the new lint will flag what is missing.
