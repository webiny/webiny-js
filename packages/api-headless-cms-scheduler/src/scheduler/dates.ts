import type { DateISOString } from "~/scheduler/types.js";

/**
 * We can safely cast the result of `toISOString()` to `DateISOString` type,
 * We need this to ensure that no malformed date strings are used in the scheduler.
 */
export const dateToISOString = (value: Date): DateISOString => {
    return value.toISOString() as DateISOString;
};

export const isoStringToDate = (value: DateISOString | undefined): Date | undefined => {
    if (typeof value === "string") {
        try {
            return new Date(value);
        } catch {
            return undefined;
        }
    }
    return undefined;
};
