import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { BaseFieldBuilder } from "./BaseFieldBuilder.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
import { FieldBuilderRegistry } from "../abstractions.js";
import { LayoutBuilder } from "../LayoutBuilder.js";
import type { CmsModelField, CmsModelLayoutCell } from "~/types/index.js";

export interface IObjectFieldBuilder extends DataFieldBuilder<"object"> {
    required(message?: string): this;
    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, BaseFieldBuilder<any>>
    ): this;
    layout(layoutOrBuilder: string[][] | ((builder: LayoutBuilder) => void)): this;
}

export class ObjectFieldBuilder extends DataFieldBuilder<"object"> implements IObjectFieldBuilder {
    private layoutBuilder: LayoutBuilder;
    private fieldBuildersMap = new Map<string, BaseFieldBuilder<any>>();

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
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, BaseFieldBuilder<any>>
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
        this.config.settings = this.config.settings || {};

        // Build nested fields, separating data fields from layout fields
        const fields: CmsModelField[] = [];
        const layoutReplacements = new Map<string, CmsModelLayoutCell>();

        for (const [fieldId, builder] of this.fieldBuildersMap) {
            const result = builder.build();
            if (result.type === "layout") {
                layoutReplacements.set(fieldId, result.layoutCell);
                if (result.fields) {
                    fields.push(...result.fields);
                }
            } else {
                fields.push(result.field);
            }
        }

        this.config.settings.fields = fields;

        // Build layout and apply replacements
        const rawLayout = this.layoutBuilder.build();
        this.config.settings.layout = rawLayout.map(row =>
            row.map(cell => layoutReplacements.get(cell) ?? cell)
        );

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
