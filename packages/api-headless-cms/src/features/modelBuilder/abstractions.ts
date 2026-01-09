import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelGroup } from "~/types/index.js";
import type { CmsApiModelFull, CmsPrivateModelFull } from "~/plugins/index.js";
import type { FieldBuilder } from "~/features/modelBuilder/fields/FieldBuilder.js";

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
 * Public Model
 */

export interface IPublicModelBuilder {
    modelId(id: string): this;
    name(name: string): this;
    singularApiName(name: string): this;
    pluralApiName(name: string): this;
    group(group: CmsModelGroup): this;
    icon(icon: string): this;
    description(description: string): this;
    titleFieldId(fieldId: string): this;
    descriptionFieldId(fieldId: string): this;
    imageFieldId(fieldId: string): this;
    layout(layout: string[][]): this;
    tags(tags: string[]): this;
    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this;
    build(): CmsApiModelFull;
}

export interface IPublicModel {
    buildModel(builder: IPublicModelBuilder): Promise<IPublicModelBuilder> | IPublicModelBuilder;
}

export const PublicModel = createAbstraction<IPublicModel>("PublicModel");
export namespace PublicModel {
    export type Interface = IPublicModel;
    export type Builder = IPublicModelBuilder;
}

/**
 * Private Model
 */

export interface IPrivateModelBuilder {
    modelId(id: string): this;
    name(name: string): this;
    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this;
    build(): Omit<CmsPrivateModelFull, "group" | "isPrivate">;
}

/**
 * PrivateModelBuilder abstraction - external developers implement this to provide private models
 * The buildModel method receives a builder and returns it (possibly decorated/modified)
 */
export interface IPrivateModel {
    buildModel(builder: IPrivateModelBuilder): Promise<IPrivateModelBuilder> | IPrivateModelBuilder;
}

export const PrivateModel = createAbstraction<IPrivateModel>("PrivateModel");
export namespace PrivateModel {
    export type Interface = IPrivateModel;
    export type Builder = IPrivateModelBuilder;
}
