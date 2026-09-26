# @webiny/project-standalone-template

> Level 13 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/project-standalone-template` has no `src/` — it is a template/config package, but a much richer one than its AWS counterpart: it holds the standalone (self-hosted) hosting type's `webiny.config.base.tsx`, plus the actual generated Admin app scaffold (`appTemplates/admin/`: `App.tsx`, `Extensions.tsx`, `index.tsx`) and the generated API GraphQL handler scaffold (`appTemplates/api/graphql/`: `index.ts`, `extensions.ts`, and its own `package.json`), since — unlike AWS — the standalone hosting type's generated-app templates live directly in this package rather than in an external hosting-specific package. This makes the generated API app's `package.json` directly auditable, and it reveals a real, confirmed gap: several Admin UI features that `@webiny/app-serverless-cms` always renders have no corresponding backend package listed here. No hardcoded secrets, permissive CORS defaults, or debug flags were found anywhere in this package's template files.

## Public API
N/A — no `exports`/`main` field in the top-level `package.json`. The generated Admin app's `App.tsx` imports `Admin` from `@webiny/app-serverless-cms` (1 caller, confirmed by codegraph), and the generated API app's `index.ts` imports `createSqlApiHandler`/`__WEBINY_DB_FACTORY__` from `@webiny/api-event-handler-standalone-sql`.

## Bugs

**Main-session verification (refuted):** the backend packages are pulled in transitively. `@webiny/api-event-handler-core` (a dependency of both composition roots) depends on `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows` and `api-website-builder-scheduler`; `api-event-handler-standalone` brings `api-scheduler`, `api-scheduler-standalone` and `background-tasks-standalone`; `api-event-handler-standalone-sql` brings `api-audit-logs-sql`. The "missing backend" rows below are therefore not bugs; the only valid observation is that these dependencies are implicit rather than declared by the template.
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | ~~high~~ refuted | packages/project-standalone-template/template/appTemplates/api/graphql/package.json:8-19 | The generated API app's dependency list is `api-event-handler-standalone-sql`, `api-aco`, `api-core`, `api-file-manager`, `api-headless-cms`, `api-headless-cms-aco`, `api-mailer`, `api-record-locking`, `api-website-builder`, `api-websockets`, `api-workflows`, `build-tools` — it has no `api-audit-logs`, `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows`, `api-website-builder-scheduler`, `api-scheduler`, or `@webiny/background-tasks`. Meanwhile `appTemplates/admin/src/App.tsx` renders `@webiny/app-serverless-cms`'s `<Admin>`, which unconditionally renders the UI for every one of those features (Audit Logs, CMS scheduling, CMS/Website Builder review workflows, Website Builder scheduling, the generic Scheduler module, and Background Tasks). | A developer runs `webiny init` (or equivalent) with the standalone template, gets a working Admin app that visibly offers Audit Logs / content scheduling / review workflows / background tasks, and every one of those screens fails against the deployed GraphQL API because the backend package was never installed. | high — confirmed directly by reading the full generated `package.json` and comparing it against `app-serverless-cms/src/Admin.tsx`'s full render tree. |

## Duplication
N/A for jscpd (no `src/`). `template/webiny.config.base.tsx`'s `FeatureFlags`/`<FeatureFlagsGate>` wrapper (lines 7-24) is duplicated verbatim with `project-aws-template/template/webiny.config.base.tsx` (differing only in the hosting-specific component rendered inside it: `<ProjectStandalone />` vs `<ProjectAws />`/`<Infra.ProductionEnvironments />`/`<RemoteComponents />`). See `docs/reports/level-10/project-template-base.md` for the recommended fix (extract into `@webiny/project-template-base`, which exists for exactly this purpose).

## Dead code
N/A — `appTemplates/admin/src/Extensions.tsx`'s empty `Extensions` component is an intentional CLI-managed scaffold placeholder ("This file is automatically updated by Webiny"), not dead code.

## Convention issues
None found — the small set of template files present (`App.tsx`, `Extensions.tsx`, `index.ts`) are simple, single-purpose, and consistent with conventions.

## Test gaps
N/A — template/config package with no business logic to unit test.

## Recommendations
1. Add the missing backend dependencies to `appTemplates/api/graphql/package.json` (`api-audit-logs`, `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows`, `api-website-builder-scheduler`, `api-scheduler`, `@webiny/background-tasks`) so a scaffolded standalone project's backend actually supports every feature its Admin app shows — or make `app-serverless-cms`'s `<Admin>` render these conditionally.
2. Extract the duplicated `FeatureFlags`/`<FeatureFlagsGate>` wrapper into `@webiny/project-template-base`.
3. No security issues found in this package's template files (no secrets, CORS, or debug defaults) — nothing further to action there.
