# Database Options for api-headless-cms-sql

Date: 2026-06-08

## Current State

Tests run against **SQLite in-memory** via `better-sqlite3`. A single shared Knex instance is created in `setupFile.js` with `{ client: "better-sqlite3", connection: { filename: ":memory:" } }`. Every `beforeEach` drops all tables and resets schema managers, so each test starts with a clean database.

This works but has limitations:
- No persistence between test runs (useful for debugging).
- SQLite dialect differences mask real SQL issues.
- Cannot test concurrent access, connection pooling, or transaction isolation.
- No way to inspect database state after a failed test.

## SQL Dialect Compatibility

The implementation is **highly dialect-agnostic**. All complex data (values, identity objects, metadata) is serialized to JSON text columns. Filtering and sorting happen in-memory after loading rows. The only SQL used:

- `CREATE TABLE` with `text`, `integer`, `boolean`, `bigInteger` columns.
- Simple `WHERE` clauses: equality, `IN`, comparison operators.
- `ORDER BY` on text columns.
- Basic `INSERT`, `UPDATE`, `DELETE`.
- `schema.hasTable()` for lazy table creation.
- Composite indexes on `(tenant, modelId, isLatest)` etc.

No JSON operators, CTEs, window functions, full-text search, arrays, or stored procedures. Any Knex-supported database should work.

## Option 1: SQLite File-Based (Simplest)

Change `:memory:` to a file path. Zero infrastructure.

### What Changes

```js
/* setupFile.js */
const knex = knexLib({
    client: "better-sqlite3",
    connection: { filename: "/tmp/webiny-cms-test.db" },
    useNullAsDefault: true
});
```

### Pros
- No external dependencies.
- Can inspect `.db` file after test failure with any SQLite viewer.
- Same dialect as current tests — no new failure modes.

### Cons
- Still SQLite — no concurrent writers, no real connection pool, different type coercion than PostgreSQL.
- File must be cleaned between runs (or use a timestamped filename).
- Does not catch PostgreSQL-specific issues.

### When to Use
Quick debugging of test state. Not a production-like environment.

---

## Option 2: PostgreSQL via Docker Compose (Recommended)

A `docker-compose.yml` in the package (or repo root) runs a persistent PostgreSQL container. Tests connect through the `pg` Knex client.

### What Changes

**docker-compose.yml** (repo root or package-level):
```yaml
services:
  postgres:
    image: postgres:17
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: webiny
      POSTGRES_PASSWORD: webiny
      POSTGRES_DB: webiny_cms_test
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**New dev dependency**: `pg` (PostgreSQL client for Node.js).

**setupFile.js** — add a PostgreSQL preset:
```js
const client = process.env.SQL_CLIENT || "better-sqlite3";

const configs = {
    "better-sqlite3": {
        client: "better-sqlite3",
        connection: { filename: ":memory:" },
        useNullAsDefault: true
    },
    pg: {
        client: "pg",
        connection: {
            host: process.env.PG_HOST || "localhost",
            port: Number(process.env.PG_PORT || 5432),
            user: process.env.PG_USER || "webiny",
            password: process.env.PG_PASSWORD || "webiny",
            database: process.env.PG_DATABASE || "webiny_cms_test"
        },
        pool: { min: 1, max: 5 }
    }
};

const knex = knexLib(configs[client]);
```

**setupAfterEnv.js** — generalize table cleanup:
```js
/* Current SQLite-specific cleanup: */
const tables = await knex.raw(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
);

/* PostgreSQL equivalent: */
const tables = await knex.raw(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
`);

/* Or use a client-agnostic approach via Knex: */
const inspector = knex.client.inspector?.() ?? null;
/* Knex doesn't have a universal "list tables" — safest to branch on client. */
```

**Test invocation**:
```bash
# SQLite (default, fast, no infra)
yarn test:sql packages/api-headless-cms

# PostgreSQL (persistent, production-like)
SQL_CLIENT=pg yarn test:sql packages/api-headless-cms
```

### Pros
- Closest to production behavior.
- Catches type coercion, NULL handling, and text comparison differences.
- Data persists across runs — inspect with `psql` after failures.
- Supports concurrent connections and connection pooling.
- Docker Compose is standard, reproducible, works in CI.

### Cons
- Requires Docker.
- Slightly slower test startup (connection handshake vs. in-memory).
- Table cleanup is slower than in-memory drop (but still fast).
- One more dependency (`pg` package).

### Long-Running Workflow
```bash
# Start once, leave running
docker compose up -d

# Run tests as many times as needed
SQL_CLIENT=pg yarn test:sql packages/api-headless-cms

# Stop when done (data preserved in volume)
docker compose stop

# Full cleanup (drops data)
docker compose down -v
```

---

## Option 3: Local PostgreSQL (No Docker)

Install PostgreSQL directly on the host via Homebrew/apt. Same connection config as Option 2, just no container.

### macOS Setup
```bash
brew install postgresql@17
brew services start postgresql@17
createdb webiny_cms_test
createuser -s webiny
```

### Pros
- Fastest connection (no Docker networking layer).
- Always running after `brew services start`.
- Simplest for solo developer workflow.

### Cons
- Not reproducible across machines (version drift).
- Manual setup.
- Harder to reset to clean state than Docker volumes.
- Doesn't work in CI without additional config.

---

## Option 4: Turso / libSQL (SQLite over HTTP)

Turso is a hosted SQLite-compatible database (backed by libSQL). Could be useful if you want a persistent SQLite-dialect database without running infrastructure.

### Pros
- SQLite dialect — no migration from current tests.
- Hosted, persistent, zero local infra.
- Supports branching (test databases as branches).

### Cons
- External service dependency (network latency in tests).
- SQLite limitations remain (no concurrent writes, no real JSON type).
- Not a production target — doesn't validate PostgreSQL behavior.
- Adds a paid service.

---

## Recommendation

**Use Option 2 (Docker Compose PostgreSQL)** as the primary persistent test database. Keep SQLite in-memory as the default fast path for CI and quick local runs.

### Implementation Plan

1. Add `docker-compose.yml` to repo root (or `packages/api-headless-cms-sql/`).
2. Add `pg` as a dev dependency to `api-headless-cms-sql`.
3. Refactor `setupFile.js` to select client via `SQL_CLIENT` env var.
4. Refactor `setupAfterEnv.js` table cleanup to support both dialects.
5. Add `test:sql:pg` script to root `package.json`.
6. Verify all 878 tests pass on both SQLite and PostgreSQL.

### Estimated Effort

Steps 1-5 are mechanical — a few hours. Step 6 (fixing dialect-specific failures) depends on how many surface. Given the implementation avoids dialect-specific SQL, expect very few.

### Key Knex Config Differences

| Setting | SQLite | PostgreSQL |
|---------|--------|------------|
| `client` | `better-sqlite3` | `pg` |
| `useNullAsDefault` | `true` (required) | not needed |
| `pool` | not needed | `{ min: 1, max: 5 }` |
| `connection` | `{ filename }` | `{ host, port, user, password, database }` |
| Boolean storage | `0`/`1` integers | native `boolean` |
| JSON storage | text (current approach works) | text (or `jsonb` if we upgrade later) |

### Table Cleanup by Dialect

```js
async function dropAllTables(knex) {
    const client = knex.client.config.client;

    if (client === "better-sqlite3") {
        const tables = await knex.raw(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        for (const { name } of tables) {
            await knex.schema.dropTableIfExists(name);
        }
        return;
    }

    if (client === "pg") {
        const result = await knex.raw(`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        `);
        for (const { tablename } of result.rows) {
            await knex.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
        }
        return;
    }

    throw new Error(`Unsupported client for table cleanup: ${client}`);
}
```

## Future Considerations

- **PostgreSQL JSON operators**: Once we have a persistent PostgreSQL, we can optionally move filtering from in-memory to SQL using `jsonb` columns and `@>`, `?`, `->` operators. This would significantly improve query performance on large datasets but breaks SQLite compatibility.
- **Connection pooling tests**: PostgreSQL enables testing pool exhaustion, connection timeouts, and concurrent transaction behavior.
- **CI integration**: The Docker Compose setup can run in CI with a service container. SQLite remains the fast default for PRs; PostgreSQL runs in nightly or pre-release pipelines.
