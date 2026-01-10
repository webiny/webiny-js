import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { FieldBuilderRegistry } from "../abstractions.js";
import { RequiredValidator, ListMinLengthValidator, ListMaxLengthValidator } from "./validators.js";

export interface IRefFieldBuilder
    extends FieldBuilder<"ref">,
        RequiredValidator,
        ListMinLengthValidator,
        ListMaxLengthValidator {
    models(models: Array<{ modelId: string }>): this;
}

class RefFieldBuilder extends FieldBuilder<"ref"> implements IRefFieldBuilder {
    constructor() {
        super("ref");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    models(models: Array<{ modelId: string }>): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.models = models;
        return this;
    }

    listMinLength(value: number, message?: string): this {
        return this.listValidation({
            name: "minLength",
            message: message || "Too few items.",
            settings: { value: String(value) }
        });
    }

    listMaxLength(value: number, message?: string): this {
        return this.listValidation({
            name: "maxLength",
            message: message || "Too many items.",
            settings: { value: String(value) }
        });
    }
}

class RefFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "ref";

    create(): IRefFieldBuilder {
        return new RefFieldBuilder();
    }
}

export const RefFieldType = FieldType.createImplementation({
    implementation: RefFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        ref(): IRefFieldBuilder;
    }
}
