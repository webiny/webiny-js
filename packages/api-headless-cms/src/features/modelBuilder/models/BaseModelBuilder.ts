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
        tags?: string[];
    } = {};

    protected isSingleEntry = false;
    protected fieldBuildersMap = new Map<string, FieldBuilder<any>>();

    public constructor(protected registry: FieldBuilderRegistry.Interface) {}

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
        // Pass existing fields to registry so it can return them when extending
        (this.registry as any).existingFields = this.fieldBuildersMap;

        const fieldBuilders = builder(this.registry);

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            // Set the fieldId from the object key
            fieldBuilder.fieldId(key);

            const existingBuilder = this.fieldBuildersMap.get(key);
            const isExtendMode = (fieldBuilder as any)._extendMode;

            if (isExtendMode && existingBuilder) {
                // Extension mode - validate type and merge operations
                if (existingBuilder.type !== fieldBuilder.type) {
                    throw new Error(
                        `Cannot extend field "${key}": type mismatch. Expected "${existingBuilder.type}", got "${fieldBuilder.type}".`
                    );
                }
                // Merge operations from temporary new builder into existing builder
                this.mergeFieldOperations(key, existingBuilder, fieldBuilder);
            } else if (existingBuilder && !isExtendMode) {
                // Replacement mode - validate type
                if (existingBuilder.type !== fieldBuilder.type) {
                    throw new Error(
                        `Cannot redefine field "${key}": type mismatch. Expected "${existingBuilder.type}", got "${fieldBuilder.type}".`
                    );
                }
                // Replace with new builder
                this.fieldBuildersMap.set(key, fieldBuilder);
            } else if (!existingBuilder && !isExtendMode) {
                // New field - store builder
                this.fieldBuildersMap.set(key, fieldBuilder);
            } else {
                // isExtendMode but no existingBuilder - this is an error
                throw new Error(
                    `Cannot extend field "${key}": field does not exist. Use .extend() only for existing fields.`
                );
            }
        }

        return this;
    }

    /**
     * Merge field operations from extension builder into existing builder.
     * This handles the case where multiple fields of the same type exist,
     * and we need to transfer operations from the temporary new builder
     * to the existing builder.
     * @internal
     */
    private mergeFieldOperations(
        fieldId: string,
        existing: FieldBuilder<any>,
        extension: FieldBuilder<any>
    ): void {
        // For object fields, merge nested fields and layout operations
        if (existing.type === "object" && extension.type === "object") {
            const existingFieldMap = (existing as any).fieldBuildersMap;
            const extensionFieldMap = (extension as any).fieldBuildersMap;

            // Merge nested field builders
            if (extensionFieldMap) {
                for (const [nestedKey, nestedBuilder] of extensionFieldMap.entries()) {
                    existingFieldMap.set(nestedKey, nestedBuilder);
                }
            }

            // Merge layout operations
            const existingLayoutBuilder = (existing as any).layoutBuilder;
            const extensionLayoutBuilder = (extension as any).layoutBuilder;

            if (extensionLayoutBuilder) {
                const snapshot = extensionLayoutBuilder.getSnapshot();

                // If extension called setLayout() with an array, apply it to existing
                // We detect this by checking if there's a layout but no modifiers
                if (snapshot.layout.length > 0 && snapshot.modifiers.length === 0) {
                    existingLayoutBuilder.setLayout(snapshot.layout);
                }

                // Apply all modifiers from extension to existing
                for (const modifier of snapshot.modifiers) {
                    existingLayoutBuilder.addModifier(modifier);
                }
            }
        }
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
