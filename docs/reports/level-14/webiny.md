# @webiny/webiny

> Level 14 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`webiny` is the top-level meta-package end users install; it contains zero business logic — every one of its ~85 source files (`src/admin.ts`, `src/admin/*.ts`, `src/api.ts`, `src/api/*.ts`, `src/infra*.ts`, `src/cli.ts`, `src/extensions.ts`) is a pure re-export barrel pointing into other packages' internal file paths (e.g. `export { Ai, ... } from "@webiny/api-core/features/ai/index.js"`), with a `package.json` `exports` map that mirrors each of those ~85 files as its own public subpath. Health is fine in the sense that there's no logic to have bugs, but the design has a real structural risk: it re-exports deep internal paths from ~40 dependency packages rather than each package's own curated entrypoint, and all of those dependencies are pinned at `"0.0.0"` (monorepo lockstep versioning) with no independent semver signal — so an internal rename inside e.g. `@webiny/api-core/features/ai/` would silently break `webiny`'s own public `exports` map in the same release, with nothing forcing a version bump on `webiny` itself to flag it.

## Public API
- `src/api.ts`, `src/admin.ts`, `src/infra.ts`, `src/cli.ts`, `src/extensions.ts` and one file per feature under `src/admin/*`, `src/api/*`, `src/infra/*` — each re-exported at a matching `package.json` `exports` subpath (e.g. `"./api/cms/model"`, `"./admin/website-builder/lexical"`). These are the extension-authoring surface every Webiny project's `webiny.config.tsx`, custom extensions, and this repo's own `project-aws-template`/`project-standalone-template` composition roots import from (e.g. `packages/webiny/src/extensions.ts` re-exports `Api`/`Admin`/`Cli`/`Infra`/`Project` from `@webiny/project-aws`, consumed by `webiny.config.base.tsx` in both templates).
- Spot-checked: every `exports` map entry inspected corresponds to an existing `src/*.ts(x)` file (no dangling subpath found in the sample checked); `./admin/icons/*` is a wildcard passthrough to the `admin/icons/` SVG directory rather than a curated re-export.

## Bugs
None found — the package is 100% re-exports with no runtime logic to break.

## Duplication
`jscpd` reports one internal clone: `packages/webiny/src/admin/cms/lexical.ts` and `packages/webiny/src/admin/website-builder/lexical.ts` share a 16-line duplicated block starting at line 3 in both files. Given both files are themselves thin re-export barrels (matching the file-per-feature pattern), this is very likely two near-identical sets of re-export statements (e.g. the same Lexical toolbar-action types re-exported under both the CMS and Website Builder namespaces) rather than duplicated logic — low practical impact, but worth a quick look to see if one should just re-export from the other.

## Dead code
Not checked exhaustively within budget — with ~85 re-export files each declaring its own `exports` subpath, verifying zero consumers for each would require one codegraph query per file, which exceeds the budget for this package. No specific dead export identified with confidence.

## Convention issues
Re-exporting other packages' *internal* module paths (`@webiny/api-core/features/ai/index.js`, `@webiny/app-admin/features/tools/index.js`, etc.) rather than those packages' own top-level public entrypoint is not blocked by anything technical — `api-core`'s own `package.json` `exports` map is just `{".": ..., "./*": ...}` (a wildcard passthrough with no curated subpath list), so nothing prevents deep-importing — but it does mean `webiny`'s stable, publicly-documented API surface is committed to ~40 other packages' internal file layout with no contract enforcing it stays put. This is architecturally risky at the scale of ~85 re-exported files, though not a rule violation per se since none of the source packages declare a narrower `exports` map that would block it. Medium confidence this is worth flagging given the audit's explicit focus on export-map hygiene for this package.

## Test gaps
N/A — no logic to test; the package is exclusively re-export declarations. (There is no `__tests__` directory, which is expected for a pure barrel package.)

## Recommendations
1. Where a dependency package's public entrypoint (`.`) already exports the symbol `webiny` needs, re-export from there instead of the deeper internal path — this removes the silent-breakage risk described above without changing the public subpath contract.
2. Add a lightweight CI check (or a script) that verifies every `exports` map entry in `package.json` resolves to an existing built file, to catch drift between `src/*.ts` and the `exports` map automatically as new features are added.
3. Look at the one jscpd-flagged clone between `admin/cms/lexical.ts` and `admin/website-builder/lexical.ts` to confirm whether one should simply re-export from the other instead of duplicating the same re-export list.
