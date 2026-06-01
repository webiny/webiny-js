import { createAbstraction } from "@webiny/feature/admin";
import type {
    IFieldBuilder,
    IFieldBuilderRegistry,
    IFormModelConfig
} from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel, CmsModelField } from "~/types.js";

export interface ICmsFieldTypeMapper {
    readonly type: string;
    map(
        field: CmsModelField,
        registry: IFieldBuilderRegistry,
        context: ICmsFieldMapperContext
    ): IFieldBuilder;
}

export interface ICmsFieldMapperContext {
    model: CmsModel;
    mapField(field: CmsModelField, registry: IFieldBuilderRegistry): IFieldBuilder;
}

export const CmsFieldTypeMapper = createAbstraction<ICmsFieldTypeMapper>("CmsFieldTypeMapper");

export namespace CmsFieldTypeMapper {
    export type Interface = ICmsFieldTypeMapper;
}

export interface ICmsFormModelBuilder {
    build(model: CmsModel): IFormModelConfig;
}

export const CmsFormModelBuilder = createAbstraction<ICmsFormModelBuilder>("CmsFormModelBuilder");

export namespace CmsFormModelBuilder {
    export type Interface = ICmsFormModelBuilder;
    export type Config = IFormModelConfig;
}

export const CmsFormModelBuilderFactory = createAbstraction<ICmsFormModelBuilderFactory>(
    "CmsFormModelBuilderFactory"
);

export interface ICmsFormModelBuilderFactory {
    create(): ICmsFormModelBuilder;
}

export namespace CmsFormModelBuilderFactory {
    export type Interface = ICmsFormModelBuilderFactory;
}
