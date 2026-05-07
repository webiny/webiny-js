import { sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

const LIKE_ESCAPE_CHAR = "\\";

/**
 * Translates DynamoDB's `begins_with(column, prefix)` to SQL `column LIKE
 * 'prefix%'`, with LIKE wildcards (`%`, `_`) and the escape char itself
 * escaped in the user-supplied prefix so they're matched literally.
 *
 * Mirrors the semantics of `dynamodb-toolbox`'s `beginsWith` filter so that
 * the same storage-operations contract tests pass against both backends.
 */
export const beginsWith = (column: SQLiteColumn, prefix: string): SQL => {
    const escapedPrefix = escapeLikePattern(prefix) + "%";
    return sql`${column} LIKE ${escapedPrefix} ESCAPE ${LIKE_ESCAPE_CHAR}`;
};

const escapeLikePattern = (input: string): string => {
    return input.replace(/[\\%_]/g, ch => `${LIKE_ESCAPE_CHAR}${ch}`);
};
