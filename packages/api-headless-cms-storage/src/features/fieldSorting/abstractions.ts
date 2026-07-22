import { Abstraction } from "@webiny/di";
import type { Field } from "../../filtering/fields/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IFieldSortingCanUseParams {
    model: CmsModel;
    field?: Field;
    fieldId: string;
    order: "ASC" | "DESC";
    sortBy: string;
}

export interface IFieldSortingCreateParams {
    model: CmsModel;
    fieldId: string;
    order: "ASC" | "DESC";
    sortBy: string;
    fields: Record<string, Field>;
    field?: Field;
}

export interface IFieldSortingResult {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

export interface IFieldSortingHandler {
    canUse(params: IFieldSortingCanUseParams): boolean;
    createSort(params: IFieldSortingCreateParams): IFieldSortingResult;
}

export interface IFieldSortingRegistry {
    register(handler: IFieldSortingHandler): void;
    find(params: IFieldSortingCanUseParams): IFieldSortingHandler | undefined;
}

export const FieldSortingRegistry = new Abstraction<IFieldSortingRegistry>(
    "Cms/Storage/FieldSortingRegistry"
);

export namespace FieldSortingRegistry {
    export type Interface = IFieldSortingRegistry;
    export type Handler = IFieldSortingHandler;
    export type CanUseParams = IFieldSortingCanUseParams;
    export type CreateParams = IFieldSortingCreateParams;
    export type Result = IFieldSortingResult;
}
