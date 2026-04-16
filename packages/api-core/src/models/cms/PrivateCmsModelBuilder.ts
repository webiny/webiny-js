import { z } from "zod";
import {
    FieldDefinitionsBuilder,
    type FieldDefinitionsFactory
} from "./FieldDefinitionsBuilder.js";
import type { BaseModel } from "../base/BaseModel.js";
import type { IModelData } from "../base/abstractions.js";
import type { PrivateCmsModel, CmsModelMetadata, FieldBuilderConfig } from "./types.js";
// Import your existing ModelBuilder
import { FieldBuilder } from "./FieldBuilder.js";
import { createImplementation } from "@webiny/di";
import {
    FieldBuilderRegistry,
    type IFieldBuilderRegistry,
    PrivateCmsModelBuilder as BuilderAbstraction
} from "~/models/cms/abstractions.js";
import { ModelBuilder } from "~/models/base/ModelBuilder.js";

export interface IPrivateCmsModelBuilder {
    create<TModel extends BaseModel<any>, TFields extends z.ZodRawShape = any>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<TFields>
    ): IPrivateCmsModelConfiguration<TModel>;
}

export interface IPrivateCmsModelConfiguration<TModel extends BaseModel<any>> {
    withMethods<TMethods extends object>(
        methods: TMethods & ThisType<TModel & TMethods>
    ): IPrivateCmsModelConfiguration<TModel>;
    extendFields(
        factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>
    ): IPrivateCmsModelConfiguration<TModel>;
    build(): PrivateCmsModel<TModel>;
}

class PrivateCmsModelBuilderImpl implements IPrivateCmsModelBuilder {
    constructor(private fieldBuilderRegistry: IFieldBuilderRegistry) {}

    create<TModel extends BaseModel<any>, TFields extends z.ZodRawShape = any>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<TFields>
    ): IPrivateCmsModelConfiguration<TModel> {
        const builder = new FieldDefinitionsBuilder(this.fieldBuilderRegistry);
        const fieldShape = fieldDefinitions.factory(this.fieldBuilderRegistry);
        const fieldDefinitionsBuilder = builder.__fromObject(fieldShape);

        return new PrivateCmsModelConfiguration<TModel>(
            modelId,
            this.fieldBuilderRegistry,
            fieldDefinitionsBuilder
        );
    }
}

class PrivateCmsModelConfiguration<
    TModel extends BaseModel<any>
> implements IPrivateCmsModelConfiguration<TModel> {
    private metadata: CmsModelMetadata = {};
    // eslint-disable-next-line
    private modelMethods: Record<string, Function> = {};
    private extensionFields = new Map<string, FieldBuilderConfig>();

    constructor(
        private modelId: string,
        private fieldBuilderRegistry: IFieldBuilderRegistry,
        private fieldDefinitionsBuilder: FieldDefinitionsBuilder
    ) {}

    withMethods<TMethods extends object>(
        methods: TMethods & ThisType<TModel & TMethods>
    ): IPrivateCmsModelConfiguration<TModel> {
        Object.assign(this.modelMethods, methods);
        return this as any;
    }

    extendFields(
        factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>
    ): IPrivateCmsModelConfiguration<TModel> {
        // Use the factory to get field shape - same as createFieldDefinitions!
        const fieldShape = factory(this.fieldBuilderRegistry);

        // Convert to field configs
        for (const [fieldId, fieldBuilder] of Object.entries(fieldShape)) {
            const config = fieldBuilder.toConfig();
            config.fieldId = fieldId;
            const zodSchema = fieldBuilder.getZodSchema();

            this.extensionFields.set(fieldId, {
                fieldId,
                config,
                zodSchema
            });
        }

        return this as any;
    }

    build(): PrivateCmsModel<TModel> {
        const baseSchema = this.fieldDefinitionsBuilder.__toZodSchema();
        let finalSchema = baseSchema;

        if (this.extensionFields.size > 0) {
            const extensionsShape: Record<string, z.ZodTypeAny> = {};

            for (const [fieldId, { zodSchema }] of this.extensionFields) {
                // Make each extension field optional
                extensionsShape[fieldId] = zodSchema.optional();
            }

            const extensionsSchema = z.object(extensionsShape).optional();

            finalSchema = baseSchema.extend({
                extensions: extensionsSchema
            }) as any;
        }

        let modelBuilder = new ModelBuilder<any>(this.modelId, finalSchema);

        if (Object.keys(this.modelMethods).length > 0) {
            modelBuilder = modelBuilder.withMethods(this.modelMethods);
        }

        const ModelClass = modelBuilder.build();

        const allFields = [
            ...this.fieldDefinitionsBuilder.__getFields(),
            ...(this.extensionFields.size > 0
                ? [
                      {
                          fieldId: "extensions",
                          type: "object",
                          label: "Extensions",
                          validation: [],
                          settings: {},
                          zodSchema: z
                              .object(
                                  Object.fromEntries(
                                      Array.from(this.extensionFields.entries()).map(
                                          ([id, { zodSchema }]) => [id, zodSchema.optional()]
                                      )
                                  )
                              )
                              .optional(),
                          fields: Array.from(this.extensionFields.values()).map(f => f.config)
                      }
                  ]
                : [])
        ];

        return {
            type: "private" as const,
            modelType: "private" as const,
            Model: ModelClass as any,
            modelId: this.modelId,
            name: this.modelId,
            icon: this.metadata.icon,
            description: this.metadata.description,
            fields: allFields,
            schema: modelBuilder.getSchema() as TModel["__schema"],
            create: (data: IModelData<TModel>) => ModelClass.create(data) as TModel
        };
    }
}

export const PrivateCmsModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PrivateCmsModelBuilderImpl,
    dependencies: [FieldBuilderRegistry]
});
