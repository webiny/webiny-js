import { DateFormatter } from "./abstractions.js";
import type { FormattableDate } from "./abstractions.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

/**
 * Default absolute date/time format: `YYYY-MM-DD HH:mm`, 24-hour, UTC. Built from UTC parts rather
 * than `Intl.DateTimeFormat` so the output is fully deterministic — backend formatting must not
 * depend on the server locale or the bundled ICU version. Projects can change it by decorating
 * DateFormatter.
 */
class DefaultDateFormatterImpl implements DateFormatter.Interface {
    format(date: FormattableDate): string {
        const value = new Date(date);
        const year = value.getUTCFullYear();
        const month = pad(value.getUTCMonth() + 1);
        const day = pad(value.getUTCDate());
        const hours = pad(value.getUTCHours());
        const minutes = pad(value.getUTCMinutes());
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}

export const DefaultDateFormatter = DateFormatter.createImplementation({
    implementation: DefaultDateFormatterImpl,
    dependencies: []
});
