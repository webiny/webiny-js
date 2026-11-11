// The wall-clock fields of an instant in one timezone, read with `formatToParts` (R319, R320).
export interface ZonedDateParts {
    year: number;
    // 1 to 12.
    month: number;
    day: number;
    // 0 to 23.
    hour: number;
    minute: number;
    second: number;
    // `Mon` to `Sun`.
    weekday: string;
    // ICU's short `en-GB` name, e.g. `CEST`, `GMT-4`, `UTC`.
    zoneName: string;
}
