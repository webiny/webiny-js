import type { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IRegistryItem } from "@webiny/db";
import { EntityType } from "./getElasticsearchEntityType.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";

export interface IGetElasticsearchEntityParams {
    type: EntityType | unknown;
    dbRegistry: DbRegistry.Interface;
}

const createPredicate = (app: string, tags: NonEmptyArray<string>) => {
    return (item: IRegistryItem) => {
        return item.app === app && tags.every(tag => item.tags.includes(tag));
    };
};

export const getElasticsearchEntity = (params: IGetElasticsearchEntityParams) => {
    const { type, dbRegistry } = params;

    const getByPredicate = (predicate: (item: IRegistryItem) => boolean) => {
        return dbRegistry.getOneItem<Entity>(predicate);
    };

    try {
        switch (type) {
            case EntityType.CMS:
                return getByPredicate(createPredicate("cms", ["es"]));
        }
    } catch {}
    throw new Error(`Unknown entity type "${type}".`);
};
