import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

export interface INumberFieldBuilder extends FieldBuilder<"number"> {
    required(message?: string): this;
    min(value: number, message?: string): this;
    max(value: number, message?: string): this;
    gte(value: number, message?: string): this;
    lte(value: number, message?: string): this;
}

class NumberFieldBuilder extends FieldBuilder<"number"> implements INumberFieldBuilder {
    constructor() {
        super("number");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    min(value: number, message?: string): this {
        return this.validation({
            name: "gte",
            message: message || `Value needs to be greater or equal to ${value}.`,
            settings: { value: String(value) }
        });
    }

    max(value: number, message?: string): this {
        return this.validation({
            name: "lte",
            message: message || `Value needs to be lesser or equal to ${value}.`,
            settings: { value: String(value) }
        });
    }

    gte(value: number, message?: string): this {
        return this.validation({
            name: "gte",
            message: message || `Value needs to be greater or equal to ${value}.`,
            settings: { value: String(value) }
        });
    }

    lte(value: number, message?: string): this {
        return this.validation({
            name: "lte",
            message: message || `Value needs to be lesser or equal to ${value}.`,
            settings: { value: String(value) }
        });
    }
}

class NumberFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "number";

    create(_registry: IFieldBuilderRegistry): INumberFieldBuilder {
        return new NumberFieldBuilder();
    }
}

export const NumberFieldType = FieldType.createImplementation({
    implementation: NumberFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        number(): INumberFieldBuilder;
    }
}
