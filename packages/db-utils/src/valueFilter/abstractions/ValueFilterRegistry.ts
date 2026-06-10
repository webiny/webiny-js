import { createAbstraction } from "@webiny/feature/api";
import type { ValueFilter } from "./ValueFilter.js";

export interface IValueFilterRegistry {
    get(operation: string): ValueFilter.Interface | undefined;
    getAll(): ValueFilter.Interface[];
}

export const ValueFilterRegistry =
    createAbstraction<IValueFilterRegistry>("Db/ValueFilterRegistry");

export namespace ValueFilterRegistry {
    export type Interface = IValueFilterRegistry;
    export type Filter = ValueFilter.Interface;
}
