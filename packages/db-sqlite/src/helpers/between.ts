import { sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

/**
 * Translates DynamoDB's `between(column, start, end)` to SQL `column BETWEEN
 * start AND end`. Inclusive on both ends, matching DDB semantics.
 */
export const between = (column: SQLiteColumn, start: string, end: string): SQL => {
    return sql`${column} BETWEEN ${start} AND ${end}`;
};
