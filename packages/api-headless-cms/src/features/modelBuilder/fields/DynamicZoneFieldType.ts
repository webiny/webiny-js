import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { type IFieldBuilderRegistry } from "../abstractions.js";

export interface IDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    icon?: string;
    description?: string;
    fields: any[];
    layout?: string[][];
}

export interface IDynamicZoneFieldBuilder extends FieldBuilder<"dynamicZone"> {
    required(message?: string): this;
    template(
        id: string,
        config: {
            name: string;
            gqlTypeName: string;
            icon?: string;
            description?: string;
            fields: (registry: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
            layout?: string[][];
        }
    ): this;
}

class DynamicZoneFieldBuilder
    extends FieldBuilder<"dynamicZone">
    implements IDynamicZoneFieldBuilder
{
    private templates: IDynamicZoneTemplate[] = [];

    constructor(private registry: IFieldBuilderRegistry) {
        super("dynamicZone");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Field is required",
            settings: {}
        });
    }

    template(
        id: string,
        config: {
            name: string;
            gqlTypeName: string;
            icon?: string;
            description?: string;
            fields: (registry: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
            layout?: string[][];
        }
    ): this {
        const fieldBuilders = config.fields(this.registry);
        const fields: any[] = [];

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            // Automatically set the fieldId from the object key
            // This ensures the key and fieldId are always in sync
            fieldBuilder.fieldId(key);
            fields.push((fieldBuilder as any).build());
        }

        this.templates.push({
            id,
            name: config.name,
            gqlTypeName: config.gqlTypeName,
            icon: config.icon,
            description: config.description,
            fields,
            layout: config.layout
        });

        return this;
    }

    override build() {
        // Set templates in settings before building
        this.config.settings = this.config.settings || {};
        this.config.settings.templates = this.templates;
        return super.build();
    }
}

class DynamicZoneFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "dynamicZone";

    create(registry: IFieldBuilderRegistry): IDynamicZoneFieldBuilder {
        return new DynamicZoneFieldBuilder(registry);
    }
}

export const DynamicZoneFieldType = FieldType.createImplementation({
    implementation: DynamicZoneFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        dynamicZone(): IDynamicZoneFieldBuilder;
    }
}
