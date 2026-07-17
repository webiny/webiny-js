import { createAbstraction } from "@webiny/feature/api";
import type { ModelField } from "~/operations/entry/elasticsearch/types.js";

export interface ICmsEntryOpenSearchFieldPathParams {
    field: ModelField;
    key: string;
    value: any;
    originalValue: any;
    keyword: boolean;
}

export interface ICmsEntryOpenSearchFieldPathResult {
    basePath: string;
    path: string;
}

export interface ICmsEntryOpenSearchFieldPathFactory {
    create(params: ICmsEntryOpenSearchFieldPathParams): ICmsEntryOpenSearchFieldPathResult;
}

export const CmsEntryOpenSearchFieldPathFactory =
    createAbstraction<ICmsEntryOpenSearchFieldPathFactory>("Cms/Entry/OpenSearch/FieldPathFactory");

export namespace CmsEntryOpenSearchFieldPathFactory {
    export type Interface = ICmsEntryOpenSearchFieldPathFactory;
    export type Params = ICmsEntryOpenSearchFieldPathParams;
    export type Result = ICmsEntryOpenSearchFieldPathResult;
}
