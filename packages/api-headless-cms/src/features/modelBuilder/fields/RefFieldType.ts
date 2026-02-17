import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator, ListMinLengthValidator, ListMaxLengthValidator } from "./validators.js";

export interface IRefFieldBuilder
    extends FieldBuilder<"ref">,
        RequiredValidator,
        ListMinLengthValidator,
        ListMaxLengthValidator {
    models(models: Array<{ modelId: string }>): this;
}

class RefFieldBuilder extends FieldBuilder<"ref"> implements IRefFieldBuilder {
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

declare module "./FieldBuilder.js" {
    interface FieldRendererRegistry {
        "ref-advanced-multiple": {
            fieldType: "ref";
            settings: { newItemPosition?: "first" | "last" };
        };
        "ref-advanced-single": { fieldType: "ref"; settings: undefined };
        "ref-input": { fieldType: "ref"; settings: undefined };
        "ref-inputs": { fieldType: "ref"; settings: undefined };
        "ref-simple-multiple": { fieldType: "ref"; settings: undefined };
        "ref-simple-single": { fieldType: "ref"; settings: undefined };
    }
}
