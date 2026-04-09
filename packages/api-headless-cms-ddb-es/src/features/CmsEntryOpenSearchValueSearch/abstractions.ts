import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export interface CreatePathParams<T = any> {
    field: CmsModelField;
    key: string;
    value: T;
    originalValue: any;
}

export interface TransformParams<T = any> {
    field: CmsModelField;
    value: T;
}

export interface ICmsEntryOpenSearchValueSearch {
    readonly fieldType: string;
    transform(params: TransformParams): any;
    createPath(params: CreatePathParams): string | null;
}

export const CmsEntryOpenSearchValueSearch =
    createAbstraction<ICmsEntryOpenSearchValueSearch>("Cms/Entry/OpenSearch/ValueSearch");

export namespace CmsEntryOpenSearchValueSearch {
    export type Interface = ICmsEntryOpenSearchValueSearch;
    export type CreatePath = CreatePathParams;
    export type Transform = TransformParams;
}
