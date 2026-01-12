import { createAbstraction } from "@webiny/feature/api";
import type { PrivateModelBuilder } from "./models/PrivateModelBuilder.js";
import type { PublicModelBuilder } from "./models/PublicModelBuilder.js";

/**
 * Field Builder Registry
 * Provides access to all registered field types via dynamic methods
 */
export interface IFieldBuilderRegistry {
    // Field types will be added via module augmentation by field type implementations
    // Example: text(): ITextFieldBuilder;
}

export const FieldBuilderRegistry =
    createAbstraction<IFieldBuilderRegistry>("FieldBuilderRegistry");

export namespace FieldBuilderRegistry {
    export type Interface = IFieldBuilderRegistry;
}

/**
 * Unified Model abstraction
 * External developers implement this to provide both public and private models
 */

export interface IModelBuilder {
    private(): PrivateModelBuilder;
    public(): PublicModelBuilder;
}

export interface IModel {
    buildModel(
        builder: IModelBuilder
    ): Promise<PrivateModelBuilder | PublicModelBuilder> | PrivateModelBuilder | PublicModelBuilder;
}

export const Model = createAbstraction<IModel>("Model");
export namespace Model {
    export type Interface = IModel;
    export type Builder = IModelBuilder;
    export type FieldBuilder = FieldBuilderRegistry.Interface;
}
