import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator, GteValidator, LteValidator } from "./validators.js";

export interface INumberFieldBuilder
    extends DataFieldBuilder<"number">,
        RequiredValidator,
        GteValidator,
        LteValidator {}

class NumberFieldBuilder extends DataFieldBuilder<"number"> implements INumberFieldBuilder {
    public constructor() {
        super("number");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    gte(value: number, message?: string): this {
        return this.validation({
            name: "gte",
            message: message || "Value is too small.",
            settings: { value: String(value) }
        });
    }

    lte(value: number, message?: string): this {
        return this.validation({
            name: "lte",
            message: message || "Value is too large.",
            settings: { value: String(value) }
        });
    }
}

class NumberFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "number";

    create(): INumberFieldBuilder {
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
