# @webiny/project-aws-template

> Level 13 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/project-aws-template` has no `src/` — it is a template/config package (confirmed: `template/` contains only 3 files plus a Pulumi manifest) providing the AWS hosting type's Pulumi bootstrap (`Pulumi.yaml`, `pulumi/index.js`) and its `webiny.config.base.tsx` composition root. The actual generated Admin/API app scaffolding for AWS projects (with their own `package.json`s) lives in the external `@webiny/project-aws` package's `_templates/` directory, not here — so this package's dependency list (46 `@webiny/api-*`/`app-*` entries) functions as the AWS hosting type's overall backend-feature manifest rather than a single app's install list. No hardcoded secrets, permissive CORS defaults, or debug flags were found in any of this package's template files.

## Public API
N/A — no `exports`/`main` field in `package.json`; this package is not imported as a library. Its `template/webiny.config.base.tsx` is composed by the generated project's own `webiny.config.base.tsx` (via the CLI scaffolding), and its dependency list is what a scaffolded AWS project installs.

## Bugs

**Main-session verification (refuted):** the backend packages are pulled in transitively. `@webiny/api-event-handler-core` (a dependency of both composition roots) depends on `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows` and `api-website-builder-scheduler`; `api-event-handler-standalone` brings `api-scheduler`, `api-scheduler-standalone` and `background-tasks-standalone`; `api-event-handler-standalone-sql` brings `api-audit-logs-sql`. The "missing backend" rows below are therefore not bugs; the only valid observation is that these dependencies are implicit rather than declared by the template.
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | ~~medium~~ refuted | packages/project-aws-template/package.json (dependencies list) | `@webiny/app-serverless-cms`'s `<Admin>` (a dependency of this package) unconditionally renders `<WbScheduler />` (from `@webiny/app-website-builder-scheduler`), but `@webiny/api-website-builder-scheduler` — the matching backend package — is absent from this package's dependency list, while the analogous CMS-side pairing (`api-headless-cms-scheduler`) is present. See `docs/reports/level-10/app-serverless-cms.md` finding #1 for full detail. | Scheduling a Website Builder page/redirect publish from the Admin UI in a generated AWS project has no backend support installed by default. | medium (this package's manifest doesn't necessarily map 1:1 onto the final generated project's `package.json` — that merge logic lives in the external, unaudited `@webiny/project-aws` package) |

No template-file-level bugs (secrets, CORS, debug flags) were found; `Pulumi.yaml` and `pulumi/index.js` are minimal and parameterized correctly via `%{PROJECT_ID}`/`%{DEPLOY_ENV}`/`%{DEPLOY_VARIANT}` placeholders with no literal defaults baked in.

## Duplication
N/A for jscpd (no `src/`, no jscpd report generated). Cross-package duplication: `template/webiny.config.base.tsx`'s `FeatureFlags`/`<FeatureFlagsGate>` wrapper is duplicated verbatim in `project-standalone-template/template/webiny.config.base.tsx` — see `docs/reports/level-10/project-template-base.md` Duplication section for the fix recommendation (extract into `@webiny/project-template-base`).

## Dead code
N/A — no source to check for unused exports; this is a template/config package.

## Convention issues
None found — the one `.tsx` file present (`webiny.config.base.tsx`) is well-commented and consistent with the standalone template's equivalent file.

## Test gaps
N/A — template/config package, no logic to unit test.

## Recommendations
1. Confirm whether `@webiny/api-website-builder-scheduler` should be added to this package's dependency list (or to whichever manifest ultimately becomes a generated AWS project's `package.json`), to match the UI feature `app-serverless-cms` always renders.
2. Extract the duplicated `FeatureFlags`/`<FeatureFlagsGate>` wrapper (shared verbatim with `project-standalone-template`) into `@webiny/project-template-base`.
3. No security issues found in this package's template files — nothing further to action there.
