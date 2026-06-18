import type { Entity, TableDef } from "@webiny/db-dynamodb/toolbox.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IRegistryItem } from "@webiny/db";
import type { DbRegistry } from "@webiny/db/feature/DbRegistry/index.js";

export interface IGetTableParams {
    dbRegistry: DbRegistry.Interface;
    type: "regular" | "es";
}

const createPredicate = (app: string, tags: NonEmptyArray<string>) => {
    return (item: IRegistryItem) => {
        return item.app === app && tags.every(tag => item.tags.includes(tag));
    };
};

export const getTable = (params: IGetTableParams): TableDef => {
    const { dbRegistry, type } = params;

    const getByPredicate = (predicate: (item: IRegistryItem) => boolean) => {
        const item = dbRegistry.getOneItem<Entity>(predicate);
        return item.item;
    };

    const entity = getByPredicate(createPredicate("cms", [type]));
    if (!entity) {
        throw new Error(`Unknown entity type "${type}".`);
    }
    return entity.table as TableDef;
};
