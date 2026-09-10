# SQL Timestamps Are ISO Strings In Text Columns

Store a timestamp Webiny reads back as an ISO string in a `text` column, not a `datetime` or `timestamp` one, and never let a `Date` cross the storage boundary.

A date or timestamp column reformats the value on the way in and leaves the way out to the driver: node-postgres and mysql2 parse it into a `Date`, better-sqlite3 returns the text verbatim, and MySQL `DATETIME` drops the milliseconds before any of that. Text keeps the value identical in both directions on every driver, and ISO-8601 UTC strings still sort chronologically, so range queries and `orderBy` behave as expected.

This also keeps storage code portable. The DynamoDB registries write their data straight into the document client, where a `Date` is stored as an empty object, so code shared between the SQL and DynamoDB variants has to agree that these values are strings.

Build Knex clients through `withKnexDefaults` from `@webiny/api-core-sql`. It installs a `postProcessResponse` hook that converts any `Date` still coming out of an older column, so a missed column degrades into a correct string rather than a silent bug.

```ts
// Good
table.text("createdOn").notNullable();

await knex(tableName).insert({ createdOn: new Date().toISOString() });
```

```ts
// Bad
table.datetime("createdOn").notNullable();

// `row.createdOn` is now a `Date` on Postgres and MySQL, a string on SQLite.
await knex(tableName).insert({ createdOn: new Date() });
```
