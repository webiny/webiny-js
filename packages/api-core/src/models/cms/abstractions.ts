import { z } from "zod";
import { Abstraction } from "@webiny/di";
import type { IPrivateCmsModelConfiguration } from "./PrivateCmsModelBuilder.js";
import type { FieldDefinitionsFactory } from "./FieldDefinitionsBuilder.js";
import { type TextFieldBuilder, type ObjectFieldBuilder, FieldBuilder } from "./FieldBuilder.js";
import type { BaseModel, IModelData } from "~/models/base/BaseModel.js";

/**
 * Field Builder Registry - provides field builders
 */
export interface IFieldBuilderRegistry {
    text(): TextFieldBuilder<z.ZodString>;
    object<TShape extends z.ZodRawShape>(
        fields: (registry: IFieldBuilderRegistry) => {
            [K in keyof TShape]: FieldBuilder<TShape[K]>;
        }
    ): ObjectFieldBuilder<TShape>;
}

export const FieldBuilderRegistry = new Abstraction<IFieldBuilderRegistry>("FieldBuilderRegistry");

/**
 * Private CMS Model Builder - builds CMS model configurations
 */
export interface IPrivateCmsModelBuilder {
    create<TModel extends BaseModel<any>>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<any>
    ): IPrivateCmsModelConfiguration<TModel>;
}

export const PrivateCmsModelBuilder = new Abstraction<IPrivateCmsModelBuilder>(
    "PrivateCmsModelBuilder"
);

export namespace PrivateCmsModelBuilder {
    export type Interface = IPrivateCmsModelBuilder;
}

/**
 * CMS Model Builder - builds the model configuration for a specific model
 */
export interface ICmsModelBuilder<TModel extends BaseModel<any>> {
    buildCmsModel(): Promise<IPrivateCmsModelConfiguration<TModel>>;
}

/**
 * CMS Model Factory - creates model instances
 */
export interface ICmsModelFactory<TModel extends BaseModel<any>> {
    create(data: IModelData<TModel>): Promise<TModel>;
}
