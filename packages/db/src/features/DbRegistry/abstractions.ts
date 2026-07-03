import { createAbstraction } from "@webiny/feature/api";
import type { NonEmptyArray } from "@webiny/api/types.js";

export interface IRegistryRegisterParams<T = unknown> {
    item: T;
    app: string;
    tags: NonEmptyArray<string>;
}

export interface IRegistryItem<T = unknown> {
    item: T;
    app: string;
    tags: NonEmptyArray<string>;
}

export interface IRegistry {
    register<T = unknown>(params: IRegistryRegisterParams<T>): void;
    /**
     * Throws an error if more than one item is found or there is no item found.
     */
    getOneItem<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T>;
    /**
     * Throws an error if more than one item is found.
     */
    getItem<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T> | null;
    getItems<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T>[];
}

export const DbRegistry = createAbstraction<IRegistry>("Db/DbRegistry");

export namespace DbRegistry {
    export type Interface = IRegistry;
    export type RegisterParams<T = unknown> = IRegistryRegisterParams<T>;
    export type RegistryItem<T = unknown> = IRegistryItem<T>;
}
