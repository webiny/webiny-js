import { createAbstraction } from "@webiny/feature/api";
import type { FieldPlugin } from "~/plugins/definitions/FieldPlugin.js";

export interface IFilterUtilParams<T = any> {
    items: T[];
    where: Record<string, any>;
    /**
     * An array of fields that require some special operation.
     */
    fields: FieldPlugin[];
}

export interface IFilterUtil {
    filter<T = any>(params: IFilterUtilParams<T>): T[];
}

export const FilterUtil = createAbstraction<IFilterUtil>("Db/DynamoDB/FilterUtil");

export namespace FilterUtil {
    export type Interface = IFilterUtil;
    export type Params<T = any> = IFilterUtilParams<T>;
}
