import { createAbstraction } from "@webiny/feature/api";
import type { IValueFilter, IValueFilterCanUseParams } from "./ValueFilter.js";

export interface IValueFilterRegistry {
    get(params: IValueFilterCanUseParams): IValueFilter | undefined;
    getAll(): IValueFilter[];
}

export const ValueFilterRegistry = createAbstraction<IValueFilterRegistry>(
    "Db/DynamoDB/ValueFilterRegistry"
);

export namespace ValueFilterRegistry {
    export type Interface = IValueFilterRegistry;
    export type Filter = IValueFilter;
}
