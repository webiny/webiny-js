import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { FieldBuilderRegistry, type IFieldBuilderRegistry } from "../abstractions.js";

export interface IDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    icon?: string;
    description?: string;
    fields: any[];
}

export interface IDynamicZoneFieldBuilder extends FieldBuilder<"dynamicZone"> {
    required(message?: string): this;
    templates(
        builder: (registry: IFieldBuilderRegistry) => Array<{
            id: string;
            name: string;
            gqlTypeName: string;
            icon?: string;
            description?: string;
            fields: Record<string, FieldBuilder<any>>;
        }>
    ): this;
    rawTemplates(templates: IDynamicZoneTemplate[]): this;
}

class DynamicZoneFieldBuilder
    extends FieldBuilder<"dynamicZone">
    implements IDynamicZoneFieldBuilder
{
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

    templates(
        builder: (registry: IFieldBuilderRegistry) => Array<{
            id: string;
            name: string;
            gqlTypeName: string;
            icon?: string;
            description?: string;
            fields: Record<string, FieldBuilder<any>>;
        }>
    ): this {
        const templateConfigs = builder(this.registry);
        const templates: IDynamicZoneTemplate[] = [];

        for (const templateConfig of templateConfigs) {
            const fields: any[] = [];
            for (const [, fieldBuilder] of Object.entries(templateConfig.fields)) {
                fields.push((fieldBuilder as any).build());
            }

            templates.push({
                id: templateConfig.id,
                name: templateConfig.name,
                gqlTypeName: templateConfig.gqlTypeName,
                icon: templateConfig.icon,
                description: templateConfig.description,
                fields
            });
        }

        this.config.settings = this.config.settings || {};
        this.config.settings.templates = templates;
        return this;
    }

    rawTemplates(templates: IDynamicZoneTemplate[]): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.templates = templates;
        return this;
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
