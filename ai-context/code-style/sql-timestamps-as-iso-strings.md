# SQL Timestamps Cross The Boundary As ISO Strings

Use a normal `datetime` column for a timestamp, write it as a UTC ISO string, and read it back as one. A `Date` must never cross the storage boundary in either direction.

Drivers disagree about what a date or timestamp column returns: node-postgres and mysql2 parse it into a `Date`, better-sqlite3 hands back the text verbatim. Storage code cannot branch on that, so build every Knex client through `withKnexDefaults` from `@webiny/api-core-sql`. It installs a `postProcessResponse` hook that converts any `Date` in a response to its UTC ISO string, which makes the column's read shape the same everywhere.

Keeping these values strings also keeps storage code portable. The DynamoDB registries write their data straight into the document client, where a `Date` is stored as an empty object, so code shared between the SQL and DynamoDB variants has to agree that a timestamp is a string.

Because ISO-8601 UTC strings sort chronologically, a value read back this way can be compared and ordered as a plain string. Comparisons sent _into_ the database stay ISO strings too; the column type coerces them.

```ts
// Good
table.datetime("createdOn").notNullable();

await knex(tableName).insert({ createdOn: new Date().toISOString() });

const rows = await knex(tableName).where("createdOn", ">=", cutoff.toISOString());
```

```ts
// Bad
await knex(tableName).insert({ createdOn: new Date() });

// Reading a `Date` and comparing it as a string. On Postgres this coerces to
// "Wed Aug 04 2026 ...", which sorts below "2026-...", so every row looks stale.
const fresh = rows.filter(row => row.createdOn >= cutoff.toISOString());
```

One caveat when sub-second precision matters: MySQL `DATETIME` defaults to precision 0 and truncates milliseconds on write, so ask for `table.datetime("createdOn", { precision: 3 })`. Postgres and SQLite keep the full value as written.
