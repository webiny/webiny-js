import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

type DateTimeSubtype = "date" | "time" | "dateTimeWithTimezone" | "dateTimeWithoutTimezone";

export class DateTimeFieldBuilder extends FieldBuilder<"datetime"> {
    private _subtype: DateTimeSubtype = "date";

    constructor() {
        super("datetime");
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "date" };
    }

    dateOnly(): this {
        this._subtype = "date";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "date" };
        return this;
    }

    timeOnly(): this {
        this._subtype = "time";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "time" };
        return this;
    }

    withTimezone(): this {
        this._subtype = "dateTimeWithTimezone";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "dateTimeWithTimezone" };
        return this;
    }

    withoutTimezone(): this {
        this._subtype = "dateTimeWithoutTimezone";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "dateTimeWithoutTimezone" };
        return this;
    }

    override normalizeValue(value: unknown): unknown {
        if (value == null || value === "") {
            return value;
        }
        const str = String(value);
        switch (this._subtype) {
            case "date":
                return normalizeDateOnly(str);
            case "time":
                return normalizeTime(str);
            case "dateTimeWithoutTimezone":
                return normalizeDateTimeWithoutTimezone(str);
            case "dateTimeWithTimezone":
                return normalizeDateTimeWithTimezone(str);
            default:
                return value;
        }
    }
}

function normalizeDateOnly(value: string): string {
    try {
        return new Date(value).toISOString().slice(0, 10);
    } catch {
        return value;
    }
}

function normalizeTime(value: string): string {
    if (!value.includes(":")) {
        return value;
    }
    const parts = value.split(":");
    if (parts.length === 3) {
        return value;
    }
    if (parts.length === 2) {
        return `${value}:00`;
    }
    return value;
}

function normalizeDateTimeWithoutTimezone(value: string): string {
    if (!value.includes(" ") && !value.includes("T")) {
        return value;
    }
    try {
        const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
        const withZ =
            normalized.endsWith("Z") ||
            normalized.includes("+") ||
            /\d-\d{2}:\d{2}$/.test(normalized)
                ? normalized
                : `${normalized}.000Z`;
        return new Date(withZ).toISOString();
    } catch {
        return value;
    }
}

function normalizeDateTimeWithTimezone(value: string): string {
    if (!value.includes("T")) {
        return value;
    }
    const [initialDate, rest] = value.split("T");
    if (!rest) {
        return value;
    }

    let date: string;
    try {
        date = new Date(initialDate).toISOString().slice(0, 10);
    } catch {
        return value;
    }

    const sign = rest.includes("+") ? "+" : "-";
    const [timePart, tz] = rest.split(sign);
    const time = normalizeTime(timePart);

    return `${date}T${time}${sign}${tz}`;
}

class DateTimeFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "datetime";
    create(_registry: any) {
        return new DateTimeFieldBuilder();
    }
}

export const DateTimeFieldType = FieldType.createImplementation({
    implementation: DateTimeFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        /**
         * Defines a field that stores date and/or time values. By default, stores a full
         * ISO 8601 datetime in UTC (e.g. 2026-04-30T13:25:00.000Z).
         *
         * Use the chainable modifiers to customize the format:
         * - `dateOnly()` — calendar date only, no time component (e.g. 2026-04-30)
         * - `timeOnly()` — time only in 24-hour format (e.g. 19:35)
         * - `withTimezone()` — ISO 8601 datetime with explicit timezone offset (e.g. 2026-04-29T13:25:00+02:00)
         * - `withoutTimezone()` — ISO 8601 datetime in UTC / Zulu time (e.g. 2026-04-30T13:25:00.000Z)
         *
         * @example
         * datetime()                  // full UTC datetime
         * datetime().dateOnly()       // birthdays, due dates, holidays
         * datetime().timeOnly()       // opening hours, daily reminders
         * datetime().withTimezone()   // events tied to a specific locale
         * datetime().withoutTimezone() // timestamps, logs, sortable moments
         */
        datetime(): DateTimeFieldBuilder;
    }
}
