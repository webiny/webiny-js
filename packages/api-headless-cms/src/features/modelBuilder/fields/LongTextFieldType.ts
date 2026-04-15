import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
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
    UpperCaseSpaceValidator
} from "./fieldTypeValidator.js";

export interface ILongTextFieldBuilder
    extends DataFieldBuilder<"long-text">,
        RequiredValidator,
        MinLengthValidator,
        MaxLengthValidator,
        PatternValidator,
        EmailValidator,
        UrlValidator,
        LowerCaseValidator,
        UpperCaseValidator,
        LowerCaseSpaceValidator,
        UpperCaseSpaceValidator {}

class LongTextFieldBuilder extends DataFieldBuilder<"long-text"> implements ILongTextFieldBuilder {
    public constructor() {
        super("long-text");
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
        longText(): ILongTextFieldBuilder;
    }
}
