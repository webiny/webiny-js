/**
 * Whether the SQL schema is created at deploy time (a migration step) rather than on first use.
 *
 * With `WEBINY_SQL_SCHEMA_MANAGED=true`, storage code never checks for or creates tables at
 * runtime: no catalog queries and no DDL on a cold start. The deployment runs each package's
 * schema setup once, before the API takes traffic (and before the system is installed).
 */
export const isSqlSchemaManaged = (): boolean => process.env.WEBINY_SQL_SCHEMA_MANAGED === "true";
