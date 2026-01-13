import type { CmsModelField } from "~/types/index.js";
import { FieldBuilder, FieldBuilderRegistry } from "~/features/modelBuilder/index.js";
import { CmsModelPlugin } from "~/plugins/index.js";

/**
 * Base class for all model builders, containing shared logic.
 * Concrete builders (PrivateModelBuilder, PublicModelBuilder) extend this.
 */
export abstract class BaseModelBuilder<TBuild = CmsModelPlugin> {
    protected config: {
        modelId?: string;
        name?: string;
        fields?: CmsModelField[];
        tags?: string[];
    } = {};

    protected isSingleEntry = false;

    constructor(protected registry: FieldBuilderRegistry.Interface) {}

    modelId(id: string): this {
        this.config.modelId = id;
        return this;
    }

    name(name: string): this {
        this.config.name = name;
        return this;
    }

    singleEntry(): this {
        this.isSingleEntry = true;
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

    /**
     * Get tags with common defaults applied.
     * Always includes "type:model" and optionally "singleEntry".
     */
    protected getTags(): string[] {
        const tagsSet = new Set(this.config.tags || []);
        tagsSet.add("type:model");
        if (this.isSingleEntry) {
            tagsSet.add("singleEntry");
        }
        return Array.from(tagsSet);
    }

    /**
     * Build the final model configuration.
     * Must be implemented by concrete builders.
     */
    abstract build(): TBuild;
}
