import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldBuilderRegistry } from "../abstractions.js";
import { LayoutBuilder } from "../LayoutBuilder.js";

export interface IObjectFieldBuilder extends FieldBuilder<"object"> {
    required(message?: string): this;
    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this;
    layout(layoutOrBuilder: string[][] | ((builder: LayoutBuilder) => void)): this;
}

export class ObjectFieldBuilder extends FieldBuilder<"object"> implements IObjectFieldBuilder {
    private layoutBuilder: LayoutBuilder;
    private fieldBuildersMap = new Map<string, FieldBuilder<any>>();

    public constructor(private registry: FieldBuilderRegistry.Interface) {
        super("object");
        this.layoutBuilder = new LayoutBuilder();
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
        // Pass existing fields to registry so it can return them when extending
        (this.registry as any).existingFields = this.fieldBuildersMap;

        const fieldBuilders = builder(this.registry);
        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            // Automatically set the fieldId from the object key
            fieldBuilder.fieldId(key);
            // Store builder (not built field)
            this.fieldBuildersMap.set(key, fieldBuilder);
        }

        return this;
    }

    layout(layoutOrBuilder: string[][] | ((builder: LayoutBuilder) => void)): this {
        if (Array.isArray(layoutOrBuilder)) {
            // Set base layout and clear modifiers
            this.layoutBuilder.setLayout(layoutOrBuilder);
        } else {
            // Queue the modifier callback
            this.layoutBuilder.addModifier(layoutOrBuilder);
        }

        return this;
    }

    override build() {
        // Build all nested fields from field builders
        this.config.settings = this.config.settings || {};
        this.config.settings.fields = Array.from(this.fieldBuildersMap.values()).map(builder =>
            builder.build()
        );

        // Build layout
        this.config.settings.layout = this.layoutBuilder.build();

        return super.build();
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
