import { createAbstraction } from "@webiny/feature/api";
import type { PrivateModelBuilder } from "./models/PrivateModelBuilder.js";
import type { PublicModelBuilder } from "./models/PublicModelBuilder.js";
import type { IModelBuilderPrivateInput, IModelBuilderPublicInput } from "./models/ModelBuilder.js";

/**
 * Augmentable field builder registry. Provides access to all registered field types.
 */
export interface IFieldBuilderRegistry {
    /**
     * Mark the next field creation as an extension.
     * When extending, the registry will create a temporary builder marked with _extendMode,
     * and BaseModelBuilder will merge its operations into the existing field.
     */
    extend(): this;

    // Field types will be added via module augmentation by field type implementations
    // Example: text(): ITextFieldBuilder;
}

/**
 * @internal Do not export this abstraction. We don't want external developers to use it.
 */
export const FieldBuilderRegistry =
    createAbstraction<FieldBuilderRegistry.Interface>("FieldBuilderRegistry");

export namespace FieldBuilderRegistry {
    export interface Interface extends IFieldBuilderRegistry {}
}

/**
 * Unified Model abstraction
 * External developers implement this to provide both public and private models
 */

export interface IModelBuilder {
    private(input: IModelBuilderPrivateInput): PrivateModelBuilder;
    public(input: IModelBuilderPublicInput): PublicModelBuilder;
}

export interface IModelFactory {
    execute(builder: IModelBuilder): Promise<PrivateModelBuilder[] | PublicModelBuilder[]>;
}

/** Provide code-defined content models. */
export const ModelFactory = createAbstraction<IModelFactory>("Cms/ModelFactory");
export namespace ModelFactory {
    export type Interface = IModelFactory;
    export type Return = Promise<PrivateModelBuilder[] | PublicModelBuilder[]>;
    export type Builder = IModelBuilder;
    export type FieldBuilder = FieldBuilderRegistry.Interface;
}
