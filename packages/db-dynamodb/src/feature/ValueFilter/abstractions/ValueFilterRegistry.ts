import { createAbstraction } from "@webiny/feature/api";
import type { ValueFilter } from "./ValueFilter.js";

export interface IValueFilterRegistry {
    get(params: ValueFilter.CanUseParams): ValueFilter.Interface | undefined;
    getAll(): ValueFilter.Interface[];
}

export const ValueFilterRegistry = createAbstraction<IValueFilterRegistry>(
    "Db/DynamoDB/ValueFilterRegistry"
);

export namespace ValueFilterRegistry {
    export type Interface = IValueFilterRegistry;
    export type Filter = ValueFilter.Interface;
}
