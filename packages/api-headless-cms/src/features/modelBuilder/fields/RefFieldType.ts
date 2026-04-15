import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
import type { FieldTypeValidator } from "./fieldTypeValidator.js";

export interface IRefFieldBuilder
    extends
        DataFieldBuilder<"ref">,
        FieldTypeValidator.Required,
        FieldTypeValidator.ListMinLength,
        FieldTypeValidator.ListMaxLength {
    models(models: Array<{ modelId: string }>): this;
}

class RefFieldBuilder extends DataFieldBuilder<"ref"> implements IRefFieldBuilder {
    public constructor() {
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
