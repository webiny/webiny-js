import { createAbstraction } from "@webiny/feature/admin";

export type FormattableDate = Date | string | number;

export interface IDateFormatter {
    /**
     * Formats an absolute date/time as a locale string. Pass `options` to override the defaults for
     * a specific call; change the defaults globally by decorating this abstraction.
     */
    format(date: FormattableDate, options?: Intl.DateTimeFormatOptions): string;
}

export const DateFormatter = createAbstraction<IDateFormatter>("DateFormatter");

export namespace DateFormatter {
    export type Interface = IDateFormatter;
    export type Value = FormattableDate;
}
