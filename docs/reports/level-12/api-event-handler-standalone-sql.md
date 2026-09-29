# @webiny/api-event-handler-standalone-sql

> Level 12 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-standalone-sql` is the SQL storage variant over `@webiny/api-event-handler-standalone`: it supplies `registerRootStorage`, registering DI Features for SQL core/CMS/websockets storage plus the self-hosted JWT identity provider (`SelfHostedAuthApiFeature`/`SelfHostedAuthSqlFeature`), while ACO and audit-logs storage operations are still wired through the legacy `registerExtensions`/plugin mechanism rather than as DI Features (called out explicitly in the file's own comment as intentional, pre-existing tech debt, not something this audit needed to re-derive). It also exports two standalone Knex-connection builders, `createPostgresConnection` and `createSqliteConnection`, which read an extensive set of `WEBINY_PG_*`/`WEBINY_SQL_FILENAME` environment variables with sensible required-field validation and no injection risk (all values flow into Knex's parameterized connection config, not into any raw SQL string). Overall health is good.

## Public API
- `createSqlApiHandler` (`src/createWebinyApiHandler.ts:38`) — the server handler factory for the SQL variant; consumed by generated project code, and requires the caller to supply its own `Knex` client (there is no single canonical standalone-DB connection).
- `createPostgresConnection` / `createSqliteConnection` (`src/createPostgresConnection.ts:41`, `src/createSqliteConnection.ts:23`) — convenience Knex-client builders reading `WEBINY_PG_*`/`WEBINY_SQL_FILENAME` env vars, intended to be passed straight into `createSqlApiHandler`'s `knex` option by a project's webiny.config; each throws a descriptive error for missing required config (host/port/user/password/database, or the SQLite filename) rather than failing later with an opaque driver error.

## Bugs
None found. Both connection builders validate required inputs, apply safe defaults, and pass everything through Knex's typed connection config (no string concatenation into queries). The `registerSqlApiHandler`-equivalent (`createSqlApiHandler`) mirrors the standalone base package's decorator ordering assumptions correctly (it registers root storage — including the identity provider — before the base package's own `NodeHttp*LoaderDecorator`s resolve it, since `registerRootStorage` runs inside the base handler's `root` step which registers those decorators first, and DI resolution happens later at request time).

## Duplication
N/A — jscpd reports 0 clones. `createPostgresConnection`'s `envBool`/`envInt` helpers are small and specific to that file; no meaningful overlap with `createSqliteConnection` or other packages was found.

## Dead code
None found; all four exports are consumed by `src/index.ts`'s barrel and are the package's entire public surface.

## Convention issues
None meaningful for this slice. The comment in `createWebinyApiHandler.ts` explicitly flags that ACO/audit-logs storage-ops registration for this variant still goes through the legacy `RegisterExtensionPlugins`/`registerExtensions` path rather than dedicated DI Features (unlike the DynamoDB variants' `AcoDdbFeature`/`AuditLogsDdbFeature`) — this is acknowledged, pre-existing architectural inconsistency between storage variants rather than a new convention violation introduced here, so it is noted but not scored as a bug.

## Test gaps
This package has no `__tests__` directory. Untested: `createSqlApiHandler`'s full storage-registration sequence (no smoke test analogous to `api-event-handler-aws-ddb`'s `freshInstall.test.ts`), and both connection builders' environment-variable parsing (in particular `createPostgresConnection`'s SSL-config branch, which reads certs/keys from disk paths via `fs.readFileSync` with no test verifying the CA/key/cert/reject-unauthorized combination logic).

## Recommendations
1. Add a `freshInstall.test.ts`-equivalent smoke test for `createSqlApiHandler` (boots the handler against a fresh SQLite DB via `createSqliteConnection`, which needs no external service), since this is currently the only variant package in the audited slice with zero tests and a real storage backend it could boot against cheaply.
2. Add unit tests for `createPostgresConnection`'s env-var parsing, especially the SSL branch (`sslCa`/`sslKey`/`sslCert`/`sslRejectUnauthorized` combinations) and the required-field error messages, since a misparse here would surface as a confusing connection failure in production rather than a clear test failure now.
3. As a longer-term follow-up (not urgent), migrate ACO/audit-logs storage registration for this variant onto DI Features to match the DDB variants, closing the architectural gap the file's own comment already flags.
