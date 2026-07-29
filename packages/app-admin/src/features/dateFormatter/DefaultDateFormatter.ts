import { DateFormatter } from "./abstractions.js";
import type { FormattableDate, IDateFormatter } from "./abstractions.js";

/**
 * Default absolute date/time format used across the admin app: `YYYY-MM-DD HH:mm`, 24-hour, in the
 * browser's locale. This is the single place these dates are formatted, so projects can change the
 * format everywhere at once by decorating the DateFormatter abstraction.
 */
const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
};

class DefaultDateFormatterImpl implements IDateFormatter {
    format(date: FormattableDate, options?: Intl.DateTimeFormatOptions): string {
        const formatter = new Intl.DateTimeFormat(undefined, { ...DEFAULT_OPTIONS, ...options });
        return formatter.format(new Date(date));
    }
}

export const DefaultDateFormatter = DateFormatter.createImplementation({
    implementation: DefaultDateFormatterImpl,
    dependencies: []
});
