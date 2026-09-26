# @webiny/icons

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
Not a code package — it's a build script plus a small set of raw SVG assets. `webiny.config.js`'s `build` command copies the entire `@material-design-icons/svg/outlined` icon set and 6 custom SVGs (`src/extraIcons/`) into `dist/` at build time; there is no TypeScript/JavaScript runtime logic and no React components. It's consumed widely (431 files reference `@webiny/icons`) purely as a source of static SVG file paths for Admin UI icon components elsewhere.

## Public API
N/A in the code sense — the package exports files, not JS/TS symbols. Its "API" is the set of `.svg` filenames landing in `dist/`: the ~2100 Material Design outlined icons plus 6 custom ones (`push_pin_off`, `graphql_playground`, `arrow_range`, `right_panel_open`, `left_panel_open`, `flowchart`). Consumers: 431 files under `packages/` reference `@webiny/icons` (mostly Admin UI components importing specific icon files by path).

## Bugs
None found. Checked the one plausible failure mode — a custom icon in `src/extraIcons/` silently overwriting a same-named Material icon during the copy step (`webiny.config.js`, extraIcons copied after the Material set) — and none of the 6 custom filenames collide with the installed `@material-design-icons/svg/outlined` set.

## Duplication
None — jscpd report shows 0 clones across the 6 SVG source files (both the `css`/color-token portions and the `markup` portions were compared).

## Dead code
N/A — no JS/TS logic to evaluate for dead exports. Whether all ~2100+6 copied SVGs are actually referenced by consumers was not checked (out of scope/cost for this audit; it would require diffing 431 consumer files against the full icon filename list).

## Convention issues
N/A — this is a config/build-script package, not a TS source package; the DI/one-per-file/barrel-export conventions don't apply.

## Test gaps
N/A — there's no logic to unit test beyond a filesystem copy script, which is exercised implicitly by every `yarn build`.

## Recommendations
1. No action needed — the package is small, has no bugs, and its only "logic" (the build script) is straightforward and correct.
2. If asset bloat ever becomes a concern, a follow-up could check which of the ~2100 Material icons are actually referenced by the 431 consumer files and drop unused ones from the copy step — but this is speculative and out of scope here.
3. None further.
