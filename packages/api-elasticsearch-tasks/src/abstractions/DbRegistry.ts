import type { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { IRegistryItem } from "@webiny/db";
import { createAbstraction } from "@webiny/feature/api";

export interface IDbRegistry {
    getOneItem<T = Entity>(
        predicate: (item: IRegistryItem) => boolean
    ): {
        item: T;
    };
}

export const DbRegistry = createAbstraction<IDbRegistry>("DbRegistry");
export namespace DbRegistry {
    export type Interface = IDbRegistry;
}
