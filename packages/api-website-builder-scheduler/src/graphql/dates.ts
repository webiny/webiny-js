export type DateISOString =
    `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

/**
 * We can safely cast the result of `toISOString()` to `DateISOString` type.
 * We need this to ensure that no malformed date strings are used in the scheduler.
 */
export const dateToISOString = (value: Date): DateISOString => {
    return value.toISOString() as DateISOString;
};
