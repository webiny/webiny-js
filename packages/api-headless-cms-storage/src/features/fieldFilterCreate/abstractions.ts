import { Abstraction } from "@webiny/di";
import type { Field } from "../../filtering/fields/types.js";
import type { ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterValueTransformRegistry } from "../fieldFilterValueTransform/abstractions.js";

export interface IFieldFilterCreateResult {
    field: Field;
    path: string;
    fieldPathId: string;
    filter: ValueFilterRegistry.Filter;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface IFieldFilterCreateParams<T = any> {
    key: string;
    value: T;
    field: Field;
    fields: Record<string, Field>;
    operation: string;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    getHandler: (fieldType: string) => IFieldFilterCreateHandler;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface IFieldFilterCreateHandler {
    create(
        params: IFieldFilterCreateParams
    ): null | IFieldFilterCreateResult | IFieldFilterCreateResult[];
}

export interface IFieldFilterCreateRegistry {
    register(fieldType: string, handler: IFieldFilterCreateHandler): void;
    get(fieldType: string): IFieldFilterCreateHandler | undefined;
    getDefault(): IFieldFilterCreateHandler;
}

export const FieldFilterCreateRegistry = new Abstraction<IFieldFilterCreateRegistry>(
    "Cms/Storage/FieldFilterCreateRegistry"
);

export namespace FieldFilterCreateRegistry {
    export type Interface = IFieldFilterCreateRegistry;
    export type Handler = IFieldFilterCreateHandler;
    export type Params = IFieldFilterCreateParams;
    export type Result = IFieldFilterCreateResult;
}
