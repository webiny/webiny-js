import { createImplementation } from "@webiny/feature/api";
import { DataFieldBuilder } from "./FieldBuilder.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import {
    RequiredValidator,
    MinLengthValidator,
    MaxLengthValidator,
    PatternValidator,
    EmailValidator,
    UrlValidator,
    LowerCaseValidator,
    UpperCaseValidator,
    LowerCaseSpaceValidator,
    UpperCaseSpaceValidator,
    UniqueValidator
} from "./validators.js";

export interface ITextFieldBuilder
    extends DataFieldBuilder<"text">,
        RequiredValidator,
        MinLengthValidator,
        MaxLengthValidator,
        PatternValidator,
        EmailValidator,
        UrlValidator,
        LowerCaseValidator,
        UpperCaseValidator,
        LowerCaseSpaceValidator,
        UpperCaseSpaceValidator,
        UniqueValidator {}

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        text(): ITextFieldBuilder;
    }
}

class TextFieldBuilder extends DataFieldBuilder<"text"> implements ITextFieldBuilder {
    public constructor() {
        super("text");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    minLength(value: number, message?: string): this {
        return this.validation({
            name: "minLength",
            message: message || "Value is too short.",
            settings: { value: String(value) }
        });
    }

    maxLength(value: number, message?: string): this {
        return this.validation({
            name: "maxLength",
            message: message || "Value is too long.",
            settings: { value: String(value) }
        });
    }

    pattern(regex: string, flags: string = "", message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Invalid value.",
            settings: {
                preset: "custom",
                regex,
                flags
            }
        });
    }

    email(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Please enter a valid e-mail.",
            settings: {
                preset: "email",
                regex: null,
                flags: null
            }
        });
    }

    url(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Please enter a valid URL.",
            settings: {
                preset: "url",
                regex: null,
                flags: null
            }
        });
    }

    lowerCase(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Only lower case characters are allowed.",
            settings: {
                preset: "lowerCase",
                regex: null,
                flags: null
            }
        });
    }

    upperCase(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Only upper case characters are allowed.",
            settings: {
                preset: "upperCase",
                regex: null,
                flags: null
            }
        });
    }

    lowerCaseSpace(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Only lower case characters and space are allowed.",
            settings: {
                preset: "lowerCaseSpace",
                regex: null,
                flags: null
            }
        });
    }

    upperCaseSpace(message?: string): this {
        return this.validation({
            name: "pattern",
            message: message || "Only upper case characters and space are allowed.",
            settings: {
                preset: "upperCaseSpace",
                regex: null,
                flags: null
            }
        });
    }

    unique(message?: string): this {
        return this.validation({
            name: "unique",
            message: message || "Value must be unique.",
            settings: {}
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
