import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryOpenSearchValueTransformerParams {
    field: CmsModelField;
    value: any;
}

export interface ICmsEntryOpenSearchValueTransformer {
    transform(params: ICmsEntryOpenSearchValueTransformerParams): any;
}

export const CmsEntryOpenSearchValueTransformer =
    createAbstraction<ICmsEntryOpenSearchValueTransformer>("Cms/Entry/OpenSearch/ValueTransformer");

export namespace CmsEntryOpenSearchValueTransformer {
    export type Interface = ICmsEntryOpenSearchValueTransformer;
    export type Params = ICmsEntryOpenSearchValueTransformerParams;
}
