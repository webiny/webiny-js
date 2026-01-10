import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

export type DateTimeType = "date" | "time" | "dateTimeWithTimezone" | "dateTimeWithoutTimezone";

export interface IDateTimeFieldBuilder extends FieldBuilder<"datetime"> {
    required(message?: string): this;
    dateTimeType(type: DateTimeType): this;
    dateOnly(): this;
    timeOnly(): this;
    withTimezone(): this;
    withoutTimezone(): this;
}

class DateTimeFieldBuilder extends FieldBuilder<"datetime"> implements IDateTimeFieldBuilder {
    constructor() {
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
}

class DateTimeFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "datetime";

    create(_registry: IFieldBuilderRegistry): IDateTimeFieldBuilder {
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
