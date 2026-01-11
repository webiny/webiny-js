import type { CmsPrivateModelFull } from "~/plugins/CmsModelPlugin.js";
import type { CmsModelField } from "~/types/index.js";
import {
    FieldBuilder,
    FieldBuilderRegistry,
    type IPrivateModelBuilder
} from "~/features/modelBuilder/index.js";

export class PrivateModelBuilder implements IPrivateModelBuilder {
    private isSingleEntry = false;
    private config: {
        modelId?: string;
        name?: string;
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

    build(): Omit<CmsPrivateModelFull, "group" | "isPrivate"> {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (!this.config.fields) {
            throw new Error("fields are required");
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
            fields: this.config.fields,
            authorization: false,
            noValidate: true,
            tags: uniqueTags
        };
    }
}
