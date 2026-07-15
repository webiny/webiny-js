# Session Handoff — 2026-07-14 — Postgres Connection Support

## What was done

- Confirmed `api-headless-cms-sql` is fully Postgres-compatible (no SQLite-specific SQL anywhere)
- Added `createPostgresConnection()` to `@webiny/api-event-handler-server-sql` with full env var support
- Added `<Infra.Postgres>` config component to `@webiny/project-server` with all serializable pg options
- Renamed `createSqliteApiHandler` to `createSqlApiHandler` (removed deprecated alias)
- Updated server template to use new name
- Added `pg` driver dependency
- 16 total commits on branch (14 from prior research session + 2 from this session)

## Key decisions

- No new package needed for Postgres CMS storage — `api-headless-cms-sql` works as-is with any Knex client
- Connection factory reads from `WEBINY_PG_*` env vars set by `<Infra.Postgres>` component
- All serializable `PgConnectionConfig` options exposed as props (5 required + 10 optional)
- SSL accepts `boolean | { rejectUnauthorized?, ca?, key?, cert? }` — file paths baked at build time, files read at runtime
- Non-serializable options (stream, types, expirationChecker) stay code-level via `connection` option
- Used `toBoolean` from `@webiny/stdlib` for env var parsing

## Current state

- Branch: `bruno/feat/api-headless-cms-postgres`, 16 commits (3 unpushed)
- Build: passing
- Lint/format: clean
- No tests added (connection factory is configuration-only)

## What might come next

- Test Postgres connection with real database
- Implementation planning for `api-headless-cms-pg-os` (Postgres + OpenSearch)
- Package scaffold, table creation, basic CRUD
- WAL worker process + OpenSearch sync
- Entry storage operations
- Testing with pglite + real OpenSearch
