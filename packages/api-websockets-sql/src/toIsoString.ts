import { WebinyError } from "@webiny/error";

/**
 * Normalize a timestamp read out of a `datetime` column to a UTC ISO string.
 *
 * We always write ISO strings, but the column's read shape is the driver's decision: node-postgres
 * and mysql2 parse it into a `Date`, better-sqlite3 hands back the text it was given, and some
 * configurations return "2026-08-04 17:02:06" with no `T` and no zone. That wall-clock is UTC,
 * because that is how it was written, so the space form is read back as UTC.
 *
 * Taking `unknown` keeps the variance out of the row type, so the rest of the registry can treat a
 * timestamp as the `string` it is declared to be. Anything unparseable throws rather than being
 * stringified: these values are compared against a cutoff to decide which connections are still
 * live, and a quietly malformed one drops a user's connections with no error to show for it.
 */
export const toIsoString = (value: unknown): string => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === "string") {
        const normalized =
            value.includes(" ") && !value.includes("T") ? `${value.replace(" ", "T")}Z` : value;

        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
    }

    throw new WebinyError(
        "Could not read a websockets connection timestamp.",
        "INVALID_CONNECTION_TIMESTAMP",
        { value }
    );
};
