import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

export interface ToIndexParams {
    model: CmsModel;
    field: CmsModelField;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    value: any;
    rawValue: any;
    getFieldIndex(fieldType: string): ICmsEntryOpenSearchFieldIndex;
}

export interface ToIndexValue {
    value?: any;
    rawValue?: any;
}

export interface FromIndexParams {
    model: CmsModel;
    field: CmsModelField;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    value: any;
    rawValue: any;
    getFieldIndex(fieldType: string): ICmsEntryOpenSearchFieldIndex;
}

export interface ICmsEntryOpenSearchFieldIndex {
    readonly fieldType: string;
    unmappedType?(field: Pick<CmsModelField, "fieldId" | "type">): string;
    toIndex(params: ToIndexParams): ToIndexValue;
    fromIndex(params: FromIndexParams): any;
}

export const CmsEntryOpenSearchFieldIndex = createAbstraction<ICmsEntryOpenSearchFieldIndex>(
    "Cms/Entry/OpenSearch/FieldIndex"
);

export namespace CmsEntryOpenSearchFieldIndex {
    export type Interface = ICmsEntryOpenSearchFieldIndex;
    export type ToIndex = ToIndexParams;
    export type ToValue = ToIndexValue;
    export type FromIndex = FromIndexParams;
}
