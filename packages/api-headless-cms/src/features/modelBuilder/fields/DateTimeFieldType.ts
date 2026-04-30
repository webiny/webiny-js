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

    dateGte(value: string, message?: string): this {
        const type = this.config.settings?.type || "date";
        return this.validation({
            name: "dateGte",
            message: message || "Date/time is earlier than the provided one.",
            settings: { value, type }
        });
    }

    dateLte(value: string, message?: string): this {
        const type = this.config.settings?.type || "date";
        return this.validation({
            name: "dateLte",
            message: message || "Date/time is later than the provided one.",
            settings: { value, type }
        });
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
