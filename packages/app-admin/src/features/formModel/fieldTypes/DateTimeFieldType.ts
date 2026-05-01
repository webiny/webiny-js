import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

type DateTimeSubtype =
    | "date"
    | "time"
    | "dateTimeWithTimezone"
    | "dateTimeWithoutTimezone"
    | "month"
    | "week"
    | "year"
    | "dateRange"
    | "multipleDates"
    | "multipleMonths"
    | "multipleYears";

export class DateTimeFieldBuilder extends FieldBuilder<"datetime"> {
    private _subtype: DateTimeSubtype = "date";

    constructor() {
        super("datetime");
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { type: "date" };
    }

    override list(): this {
        super.list();
        this._config.renderer = "dateTimeInputs";
        return this;
    }

    /**
     * Calendar date only.
     * @example datetime().dateOnly()
     *
     * Value format: `"2026-05-01"` (YYYY-MM-DD)
     */
    dateOnly(): this {
        this._subtype = "date";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { ...this._config.rendererSettings, type: "date" };
        return this;
    }

    /**
     * Time only, no date component.
     * @example datetime().timeOnly()
     *
     * Value format: `"14:30:00"` (HH:mm:ss)
     */
    timeOnly(): this {
        this._subtype = "time";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { ...this._config.rendererSettings, type: "time" };
        return this;
    }

    /**
     * Date and time with explicit timezone offset.
     * @example datetime().withTimezone()
     *
     * Value format: `"2026-05-01T14:30:00+02:00"` (ISO 8601 with offset)
     */
    withTimezone(): this {
        this._subtype = "dateTimeWithTimezone";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "dateTimeWithTimezone"
        };
        return this;
    }

    /**
     * Date and time in UTC, no timezone offset.
     * @example datetime().withoutTimezone()
     *
     * Value format: `"2026-05-01T14:30:00.000Z"` (ISO 8601 UTC)
     */
    withoutTimezone(): this {
        this._subtype = "dateTimeWithoutTimezone";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "dateTimeWithoutTimezone"
        };
        return this;
    }

    /**
     * Month and year picker.
     * @example datetime().monthOnly()
     *
     * Value format: `"2026-05"` (YYYY-MM)
     */
    monthOnly(): this {
        this._subtype = "month";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { ...this._config.rendererSettings, type: "month" };
        return this;
    }

    /**
     * ISO week picker. Selecting any day highlights and selects the full week.
     * @example
     * datetime().weekOnly()
     * datetime().weekOnly({ startsOn: 1 })  // weeks start on Monday
     *
     * Value format: `"2026-W18"` (YYYY-Www)
     */
    weekOnly(options?: { startsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): this {
        this._subtype = "week";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "week",
            ...(options?.startsOn !== undefined && { weekStartsOn: options.startsOn })
        };
        return this;
    }

    /**
     * Year picker with a scrollable grid.
     * @example
     * datetime().yearOnly()
     * datetime().yearOnly({ range: [2010, 2030] })
     *
     * Value format: `2026` (number)
     */
    yearOnly(options?: { range?: [number, number] }): this {
        this._subtype = "year";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "year",
            ...(options?.range && { yearRange: options.range })
        };
        return this;
    }

    /**
     * Date range picker with a two-month calendar.
     * @example datetime().dateRange()
     *
     * Value format: `{ from: "2026-05-01", to: "2026-05-15" }`
     */
    dateRange(): this {
        this._subtype = "dateRange";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = { ...this._config.rendererSettings, type: "dateRange" };
        return this;
    }

    /**
     * Select multiple individual dates.
     * @example datetime().multipleDates()
     *
     * Value format: `["2026-05-01", "2026-05-03"]`
     */
    multipleDates(): this {
        this._subtype = "multipleDates";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "multipleDates"
        };
        return this;
    }

    /**
     * Select multiple months.
     * @example datetime().multipleMonths()
     *
     * Value format: `["2026-01", "2026-03"]`
     */
    multipleMonths(): this {
        this._subtype = "multipleMonths";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "multipleMonths"
        };
        return this;
    }

    /**
     * Select multiple years.
     * @example
     * datetime().multipleYears()
     * datetime().multipleYears({ range: [2020, 2035] })
     *
     * Value format: `[2024, 2025, 2026]`
     */
    multipleYears(options?: { range?: [number, number] }): this {
        this._subtype = "multipleYears";
        this._config.renderer = "dateTimeInput";
        this._config.rendererSettings = {
            ...this._config.rendererSettings,
            type: "multipleYears",
            ...(options?.range && { yearRange: options.range })
        };
        return this;
    }

    /**
     * Add quick-select preset buttons to the picker. Available on all variants.
     * Each preset's `value` function is called at click time, and the variant
     * handles formatting the Date into its value type.
     * @example
     * datetime().dateOnly().presets([
     *     { label: "Today", value: () => new Date() },
     *     { label: "In a week", value: () => addDays(new Date(), 7) }
     * ])
     */
    presets(presets: Array<{ label: string; value: () => Date }>): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, presets };
        return this;
    }

    /**
     * Customize the display format shown in the picker trigger.
     * Uses date-fns format tokens.
     * @example
     * datetime().dateOnly().displayFormat("MM/dd/yyyy")   // "05/01/2026"
     * datetime().dateOnly().displayFormat("dd MMM yyyy")  // "01 May 2026"
     * datetime().monthOnly().displayFormat("MMMM yyyy")   // "May 2026"
     */
    displayFormat(format: string): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, displayFormat: format };
        return this;
    }

    override normalizeValue(value: unknown): unknown {
        if (value == null || value === "") {
            return value;
        }
        switch (this._subtype) {
            case "date":
                return normalizeDateOnly(String(value));
            case "time":
                return normalizeTime(String(value));
            case "dateTimeWithoutTimezone":
                return normalizeDateTimeWithoutTimezone(String(value));
            case "dateTimeWithTimezone":
                return normalizeDateTimeWithTimezone(String(value));
            case "month":
                return normalizeMonth(String(value));
            case "week":
                return normalizeWeek(String(value));
            case "year":
                return normalizeYear(value);
            case "dateRange":
            case "multipleDates":
            case "multipleMonths":
                return value;
            case "multipleYears":
                return normalizeMultipleYears(value);
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

function normalizeMonth(value: string): string {
    if (/^\d{4}-\d{2}$/.test(value)) {
        return value;
    }
    try {
        const d = new Date(value);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
    } catch {
        return value;
    }
}

function normalizeWeek(value: string): string {
    if (/^\d{4}-W\d{2}$/.test(value)) {
        return value;
    }
    return value;
}

function normalizeYear(value: unknown): number | unknown {
    const num = Number(value);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
        return Math.round(num);
    }
    return value;
}

function normalizeMultipleYears(value: unknown): unknown {
    if (!Array.isArray(value)) {
        return value;
    }
    return value.map(v => {
        const num = Number(v);
        return !Number.isNaN(num) && Number.isFinite(num) ? Math.round(num) : v;
    });
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
         * Defines a field that stores date and/or time values.
         *
         * Variant methods (pick one):
         * - `dateOnly()` — "2026-05-01"
         * - `timeOnly()` — "14:30:00"
         * - `withoutTimezone()` — "2026-05-01T14:30:00.000Z"
         * - `withTimezone()` — "2026-05-01T14:30:00+02:00"
         * - `monthOnly()` — "2026-05"
         * - `weekOnly()` — "2026-W18"
         * - `yearOnly()` — 2026
         * - `dateRange()` — { from: "2026-05-01", to: "2026-05-15" }
         * - `multipleDates()` — ["2026-05-01", "2026-05-03"]
         * - `multipleMonths()` — ["2026-01", "2026-03"]
         * - `multipleYears()` — [2024, 2025, 2026]
         *
         * Configuration methods (chain after variant):
         * - `.presets([...])` — quick-select buttons (all variants)
         * - `.displayFormat("MM/dd/yyyy")` — customize trigger display
         *
         * Variant-specific options (passed to variant method):
         * - `yearOnly({ range: [2020, 2030] })` — year range
         * - `multipleYears({ range: [2020, 2035] })` — year range
         * - `weekOnly({ startsOn: 1 })` — first day of week (0=Sun, 1=Mon)
         *
         * @example
         * datetime()                        // full UTC datetime (default)
         * datetime().dateOnly()             // birthdays, due dates, holidays
         * datetime().timeOnly()             // opening hours, daily reminders
         * datetime().withTimezone()         // events tied to a specific locale
         * datetime().withoutTimezone()      // timestamps, logs, sortable moments
         * datetime().monthOnly()            // billing cycles, report periods
         * datetime().weekOnly()             // sprint planning, weekly schedules
         * datetime().yearOnly({ range: [2010, 2030] })  // fiscal years
         * datetime().dateRange()            // vacation requests, booking windows
         * datetime().multipleDates()        // blackout dates, recurring events
         * datetime().multipleMonths()       // seasonal availability
         * datetime().multipleYears({ range: [2020, 2035] })  // multi-year budgets
         * datetime().dateOnly().presets([...]).displayFormat("dd/MM/yyyy")
         */
        datetime(): DateTimeFieldBuilder;
    }
}
