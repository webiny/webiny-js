import { createAbstraction } from "@webiny/feature/api";

export type FormattableDate = Date | string | number;

export interface IDateFormatter {
    /**
     * Formats an absolute date/time as a string using Webiny's default format. Change the format
     * everywhere at once by decorating this abstraction.
     */
    format(date: FormattableDate): string;
}

export const DateFormatter = createAbstraction<IDateFormatter>("DateFormatter");

export namespace DateFormatter {
    export type Interface = IDateFormatter;
    export type Value = FormattableDate;
}
