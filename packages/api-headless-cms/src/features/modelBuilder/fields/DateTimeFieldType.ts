import WebinyError from "@webiny/error";
import { isDateExpression, type DateBound } from "@webiny/utils";
import { validateDateExpressions } from "~/domain/contentModel/validation/dateExpressions.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator, DateGteValidator, DateLteValidator } from "./fieldTypeValidator.js";

export type DateTimeType = "date" | "time" | "dateTimeWithTimezone" | "dateTimeWithoutTimezone";

export interface IDateTimeFieldBuilder
    extends DataFieldBuilder<"datetime">, RequiredValidator, DateGteValidator, DateLteValidator {
    dateTimeType(type: DateTimeType): this;
    dateOnly(): this;
    timeOnly(): this;
    withTimezone(): this;
    withoutTimezone(): this;
}

class DateTimeFieldBuilder extends DataFieldBuilder<"datetime"> implements IDateTimeFieldBuilder {
    public constructor() {
        super("datetime");
        /**
         * Without a subtype the GraphQL, storage and admin layers each assume a different
         * format. Default to an ISO datetime with timezone; subtype methods override it.
         */
        this.withTimezone();
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    dateTimeType(type: DateTimeType): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.type = type;
        return this;
    }

    /**
     * Just a calendar date, no time, no timezone. Useful for things like birthdays, holidays, or due dates where the time of day doesn't matter.
     * Example: 2026-04-30
     *
     * @example
     * fields.datetime().dateOnly()
     * // day, then month, then year; single values only, not for `.list()`.
     * // The picker offers only the dates the `dateGte`/`dateLte` limits allow.
     * fields
     *     .datetime()
     *     .dateOnly()
     *     .dateGte({ expression: "today-100y" })
     *     .dateLte({ expression: "today-18y" }, "You must be 18 or older.")
     *     .renderer("birthdayInput")
     */
    dateOnly(): this {
        return this.dateTimeType("date");
    }

    /**
     * Time in 24-hours format.
     * Example: 19:35
     */
    timeOnly(): this {
        return this.dateTimeType("time");
    }

    /**
     * This is an ISO 8601 datetime with an explicit timezone offset.
     * Example: 2026-04-29T13:25:00+02:00
     */
    withTimezone(): this {
        return this.dateTimeType("dateTimeWithTimezone");
    }

    /**
     * This is an ISO 8601 datetime in UTC (Zulu time). "Z" means "this is UTC, no offset."
     * Example: 2026-04-30T13:25:00.000Z
     */
    withoutTimezone(): this {
        return this.dateTimeType("dateTimeWithoutTimezone");
    }

    /**
     * The value must be on or after the given one: a fixed value, or, on a date-only field, an
     * expression worked out from today's date every time the value is checked.
     *
     * Expressions: `today`, or `today` plus or minus a number of days (`d`), months (`m`) or
     * years (`y`). The birthday picker reads these limits, so dates outside them can't be picked.
     *
     * @example
     * fields.datetime().dateOnly().dateGte("1900-01-01")
     * // not older than 100 years
     * fields.datetime().dateOnly().dateGte({ expression: "today-100y" })
     */
    dateGte(value: DateBound, message?: string): this {
        return this.validation({
            name: "dateGte",
            message: message || "Date/time is earlier than the provided one.",
            settings: this.dateLimitSettings(value)
        });
    }

    /**
     * The value must be on or before the given one: a fixed value, or, on a date-only field, an
     * expression worked out from today's date every time the value is checked.
     *
     * @example
     * fields.datetime().dateOnly().dateLte("2026-12-31")
     * // 18 or older
     * fields
     *     .datetime()
     *     .dateOnly()
     *     .dateLte({ expression: "today-18y" }, "You must be 18 or older.")
     *     .renderer("birthdayInput")
     */
    dateLte(value: DateBound, message?: string): this {
        return this.validation({
            name: "dateLte",
            message: message || "Date/time is later than the provided one.",
            settings: this.dateLimitSettings(value)
        });
    }

    override build() {
        const result = super.build();
        validateDateExpressions(result.field);
        return result;
    }

    private dateLimitSettings(value: DateBound): Record<string, string> {
        const type = this.config.settings?.type || "date";
        if (typeof value === "string") {
            return { value, type };
        }
        if (!isDateExpression(value.expression)) {
            throw new WebinyError(
                `Invalid date expression "${value.expression}". Use "today", or "today" plus or minus a number of days, months or years, like "today-18y".`,
                "INVALID_DATE_EXPRESSION",
                { expression: value.expression }
            );
        }
        return { expression: value.expression, type };
    }
}

class DateTimeFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "datetime";

    create(): IDateTimeFieldBuilder {
        return new DateTimeFieldBuilder();
    }
}

export const DateTimeFieldType = FieldType.createImplementation({
    implementation: DateTimeFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        datetime(): IDateTimeFieldBuilder;
    }
}
