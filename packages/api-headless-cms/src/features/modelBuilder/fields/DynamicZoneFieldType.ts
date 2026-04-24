import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { type FieldBuildResult } from "./BaseFieldBuilder.js";
import { DataFieldBuilder, type BaseFieldBuilder } from "./FieldBuilder.js";
import { type IFieldBuilderRegistry } from "../abstractions.js";
import type { CmsIcon, CmsModelField, CmsModelFieldValidation } from "~/types/index.js";

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

export interface IDynamicZoneFieldBuilder extends DataFieldBuilder<"dynamicZone"> {
    required(message?: string): this;
    template(
        id: string,
        config: {
            name: string;
            gqlTypeName: string;
            icon?: CmsIcon;
            description?: string;
            fields: (registry: IFieldBuilderRegistry) => Record<string, BaseFieldBuilder<any>>;
            layout?: string[][];
        }
    ): this;
}

interface IDynamicZoneFieldBuilderTemplateConfig {
    name: string;
    gqlTypeName: string;
    icon?: CmsIcon;
    description?: string;
    fields: (registry: IFieldBuilderRegistry) => Record<string, BaseFieldBuilder<any>>;
    layout?: string[][];
}

class DynamicZoneFieldBuilder
    extends DataFieldBuilder<"dynamicZone">
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
        const fields: CmsModelField[] = [];

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            fieldBuilder.fieldId(key);
            const result: FieldBuildResult = (fieldBuilder as any).build();
            if (result.type === "data") {
                fields.push(result.field);
            } else if (result.fields) {
                fields.push(...result.fields);
            }
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
