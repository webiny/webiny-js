import { createImplementation } from "@webiny/feature/api";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";

export interface ITextFieldBuilder extends FieldBuilder<"text"> {
    required(message?: string): this;
    minLength(length: number, message?: string): this;
    maxLength(length: number, message?: string): this;
    pattern(regex: string, message?: string): this;
}

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        text(): ITextFieldBuilder;
    }
}

class TextFieldBuilder extends FieldBuilder<"text"> implements ITextFieldBuilder {
    constructor() {
        super("text");
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

    pattern(regex: string, message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Value does not match pattern",
            settings: { value: regex }
        });
    }
}

class TextFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "text";

    create(): ITextFieldBuilder {
        return new TextFieldBuilder();
    }
}

export const TextFieldType = createImplementation({
    abstraction: FieldType,
    implementation: TextFieldTypeFactory,
    dependencies: []
});
