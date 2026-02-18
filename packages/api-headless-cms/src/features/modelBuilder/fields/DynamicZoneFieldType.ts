import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { type IFieldBuilderRegistry } from "../abstractions.js";
import type { CmsIcon, CmsModelFieldValidation } from "~/types/index.js";

interface IDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    icon: CmsIcon | undefined;
    description: string;
    fields: any[];
    layout: string[][];
    validation: CmsModelFieldValidation[];
}

export interface IDynamicZoneFieldBuilder extends FieldBuilder<"dynamicZone"> {
    required(message?: string): this;
    template(
        id: string,
        config: {
            name: string;
            gqlTypeName: string;
            icon?: CmsIcon;
            description?: string;
            fields: (registry: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
            layout?: string[][];
        }
    ): this;
}

interface IDynamicZoneFieldBuilderTemplateConfig {
    name: string;
    gqlTypeName: string;
    icon?: CmsIcon;
    description?: string;
    fields: (registry: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
    layout?: string[][];
}

class DynamicZoneFieldBuilder
    extends FieldBuilder<"dynamicZone">
    implements IDynamicZoneFieldBuilder
{
    private readonly templates: IDynamicZoneTemplate[] = [];

    public constructor(private registry: IFieldBuilderRegistry) {
        super("dynamicZone");
    }

    public required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Field is required",
            settings: {}
        });
    }

    public template(id: string, config: IDynamicZoneFieldBuilderTemplateConfig): this {
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
            description: config.description || "",
            fields,
            layout: config.layout || [],
            validation: []
        });

        return this;
    }

    public override build() {
        // Set templates in settings before building
        this.config.settings = this.config.settings || {};
        this.config.settings.templates = this.templates;
        this.config.listValidation = [{ name: "dynamicZone", message: "" }];
        return super.build();
    }
}

class DynamicZoneFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "dynamicZone";

    public create(registry: IFieldBuilderRegistry): IDynamicZoneFieldBuilder {
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
