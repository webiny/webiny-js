import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldBuilderRegistry } from "../abstractions.js";

export interface IObjectFieldBuilder extends FieldBuilder<"object"> {
    required(message?: string): this;
    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this;
}

class ObjectFieldBuilder extends FieldBuilder<"object"> implements IObjectFieldBuilder {
    constructor(private registry: FieldBuilderRegistry.Interface) {
        super("object");
    }

    required(message?: string): this {
        const validation = {
            name: "required",
            message: message || "Value is required."
        };
        this.config.validation = this.config.validation || [];
        this.config.validation.push(validation);
        return this;
    }

    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this {
        const fieldBuilders = builder(this.registry);
        const fields: any[] = [];
        for (const [, fieldBuilder] of Object.entries(fieldBuilders)) {
            fields.push((fieldBuilder as any).build());
        }
        this.config.settings = this.config.settings || {};
        this.config.settings.fields = fields;
        return this;
    }
}

class ObjectFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "object";

    create(registry: FieldBuilderRegistry.Interface): IObjectFieldBuilder {
        return new ObjectFieldBuilder(registry);
    }
}

export const ObjectFieldType = FieldType.createImplementation({
    implementation: ObjectFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        object(): IObjectFieldBuilder;
    }
}
