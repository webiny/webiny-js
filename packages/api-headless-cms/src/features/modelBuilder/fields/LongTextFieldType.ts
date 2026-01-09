import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { FieldBuilderRegistry } from "../abstractions.js";

export interface ILongTextFieldBuilder extends FieldBuilder<"long-text"> {
    required(message?: string): this;
    minLength(length: number, message?: string): this;
    maxLength(length: number, message?: string): this;
}

class LongTextFieldBuilder extends FieldBuilder<"long-text"> implements ILongTextFieldBuilder {
    constructor() {
        super("long-text");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Field is required",
            settings: {}
        });
    }

    minLength(length: number, message?: string): this {
        return this.validation({
            name: "minLength",
            message: message || `Minimum length is ${length}`,
            settings: { value: length }
        });
    }

    maxLength(length: number, message?: string): this {
        return this.validation({
            name: "maxLength",
            message: message || `Maximum length is ${length}`,
            settings: { value: length }
        });
    }
}

class LongTextFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "long-text";

    create(): ILongTextFieldBuilder {
        return new LongTextFieldBuilder();
    }
}

export const LongTextFieldType = FieldType.createImplementation({
    implementation: LongTextFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        "long-text"(): ILongTextFieldBuilder;
        longText(): ILongTextFieldBuilder;
    }
}
