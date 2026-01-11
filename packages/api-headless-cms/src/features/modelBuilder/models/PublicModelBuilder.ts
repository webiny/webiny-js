import upperFirst from "lodash/upperFirst.js";
import camelCase from "lodash/camelCase.js";
import pluralize from "pluralize";
import type { CmsApiModelFull } from "~/plugins/CmsModelPlugin.js";
import type { CmsModelField, CmsModelGroup } from "~/types/index.js";
import {
    FieldBuilder,
    FieldBuilderRegistry,
    type IPublicModelBuilder
} from "~/features/modelBuilder/index.js";

const createApiName = (name: string) => {
    return upperFirst(camelCase(name));
};

const createPluralApiName = (name: string) => {
    return pluralize(createApiName(name));
};

export class PublicModelBuilder implements IPublicModelBuilder {
    private isSingleEntry = false;

    private config: {
        modelId?: string;
        name?: string;
        singularApiName?: string;
        pluralApiName?: string;
        group?: CmsModelGroup;
        icon?: string;
        description?: string;
        titleFieldId?: string;
        descriptionFieldId?: string;
        imageFieldId?: string;
        layout?: string[][];
        fields?: CmsModelField[];
        tags?: string[];
    } = {};

    constructor(private registry: FieldBuilderRegistry.Interface) {}

    modelId(id: string): this {
        this.config.modelId = id;
        return this;
    }

    name(name: string): this {
        this.config.name = name;
        return this;
    }

    singleEntry() {
        this.isSingleEntry = true;
    }

    singularApiName(name: string): this {
        this.config.singularApiName = name;
        return this;
    }

    pluralApiName(name: string): this {
        this.config.pluralApiName = name;
        return this;
    }

    group(group: CmsModelGroup): this {
        this.config.group = group;
        return this;
    }

    icon(icon: string): this {
        this.config.icon = icon;
        return this;
    }

    description(description: string): this {
        this.config.description = description;
        return this;
    }

    titleFieldId(fieldId: string): this {
        this.config.titleFieldId = fieldId;
        return this;
    }

    descriptionFieldId(fieldId: string): this {
        this.config.descriptionFieldId = fieldId;
        return this;
    }

    imageFieldId(fieldId: string): this {
        this.config.imageFieldId = fieldId;
        return this;
    }

    layout(layout: string[][]): this {
        this.config.layout = layout;
        return this;
    }

    tags(tags: string[]): this {
        this.config.tags = tags;
        return this;
    }

    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this {
        const fieldBuilders = builder(this.registry);
        const newFields: CmsModelField[] = [];

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            // Automatically set the fieldId from the object key
            // This ensures the key and fieldId are always in sync
            fieldBuilder.fieldId(key);
            newFields.push(fieldBuilder.build());
        }

        // Append new fields to existing fields (if any)
        // This allows calling .fields() multiple times to add fields incrementally
        if (!this.config.fields) {
            this.config.fields = [];
        }
        this.config.fields.push(...newFields);
        return this;
    }

    build(): CmsApiModelFull {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (!this.config.fields) {
            throw new Error("fields are required");
        }
        if (!this.config.group) {
            throw new Error("group is required");
        }

        // Always include "type:model" tag and ensure all tags are unique
        const tagsSet = new Set(this.config.tags || []);
        tagsSet.add("type:model");
        if (this.isSingleEntry) {
            tagsSet.add("singleEntry");
        }
        const uniqueTags = Array.from(tagsSet);

        return {
            modelId: this.config.modelId,
            name: this.config.name,
            singularApiName: this.config.singularApiName || createApiName(this.config.name),
            pluralApiName: this.config.pluralApiName || createPluralApiName(this.config.name),
            group: this.config.group,
            icon: this.config.icon,
            description: this.config.description || null,
            titleFieldId: this.config.titleFieldId ?? "",
            descriptionFieldId: this.config.descriptionFieldId,
            imageFieldId: this.config.imageFieldId,
            layout: this.config.layout || [],
            fields: this.config.fields,
            tags: uniqueTags
        };
    }
}
