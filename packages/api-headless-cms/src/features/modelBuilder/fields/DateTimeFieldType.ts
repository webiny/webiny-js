import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator, DateGteValidator, DateLteValidator } from "./validators.js";

export type DateTimeType = "date" | "time" | "dateTimeWithTimezone" | "dateTimeWithoutTimezone";

export interface IDateTimeFieldBuilder
    extends FieldBuilder<"datetime">,
        RequiredValidator,
        DateGteValidator,
        DateLteValidator {
    dateTimeType(type: DateTimeType): this;
    dateOnly(): this;
    timeOnly(): this;
    withTimezone(): this;
    withoutTimezone(): this;
}

class DateTimeFieldBuilder extends FieldBuilder<"datetime"> implements IDateTimeFieldBuilder {
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

    dateOnly(): this {
        return this.dateTimeType("date");
    }

    timeOnly(): this {
        return this.dateTimeType("time");
    }

    withTimezone(): this {
        return this.dateTimeType("dateTimeWithTimezone");
    }

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
