import type { Knex } from "knex";

/**
 * Webiny stores timestamps as UTC ISO strings and expects to read the same thing back. SQL drivers
 * disagree about that: node-postgres and mysql2 parse date and timestamp columns into `Date`
 * objects, while better-sqlite3 hands back whatever text was written. A `Date` leaking out of the
 * database is a problem beyond the inconsistency, because storage code shared with DynamoDB writes
 * these values straight into the document client, where a `Date` is stored as an empty object.
 *
 * Prefer a text column for anything Webiny treats as an ISO timestamp, since a real date or
 * timestamp column also reformats the value on the way in, dropping milliseconds on MySQL. These
 * helpers are the safety net for the columns that aren't text: they make sure nothing reading
 * through Knex ever sees a `Date`.
 */

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !Buffer.isBuffer(value)
    );
};

const convertRow = (row: Record<string, unknown>): void => {
    for (const key of Object.keys(row)) {
        const value = row[key];
        if (value instanceof Date) {
            row[key] = value.toISOString();
        }
    }
};

/**
 * Replaces every `Date` in a Knex response with its UTC ISO string.
 *
 * Rows are edited in place and the original response is returned, so the extra properties a driver
 * puts on a raw result (`rowCount`, `command`, and so on) survive untouched.
 */
export const datesToIsoStrings = <T>(result: T): T => {
    if (Array.isArray(result)) {
        for (const item of result) {
            if (isRecord(item)) {
                convertRow(item);
            }
        }
        return result;
    }

    if (isRecord(result)) {
        // A raw Postgres result keeps the rows one level down, under `rows`.
        const rows = result["rows"];
        if (Array.isArray(rows)) {
            for (const item of rows) {
                if (isRecord(item)) {
                    convertRow(item);
                }
            }
            return result;
        }

        // A single row, as returned by `.first()`.
        convertRow(result);
    }

    return result;
};

/**
 * Adds Webiny's defaults to a Knex config. Any `postProcessResponse` already on the config still
 * runs, and sees the response with dates already converted.
 */
export const withKnexDefaults = (config: Knex.Config): Knex.Config => {
    const postProcessResponse = config.postProcessResponse;

    return {
        ...config,
        postProcessResponse: (result, queryContext) => {
            const converted = datesToIsoStrings(result);
            return postProcessResponse ? postProcessResponse(converted, queryContext) : converted;
        }
    };
};
