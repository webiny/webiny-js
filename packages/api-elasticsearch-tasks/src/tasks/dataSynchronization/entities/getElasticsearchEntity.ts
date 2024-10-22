import { Entity } from "@webiny/db-dynamodb/toolbox";
import { NonEmptyArray } from "@webiny/api/types";
import { IRegistryItem } from "@webiny/db";
import { EntityType } from "./getElasticsearchEntityType";
import { Context } from "~/types";

export interface IGetElasticsearchEntityParams {
    type: EntityType | unknown;
    context: Context;
}

const createPredicate = (app: string, tags: NonEmptyArray<string>) => {
    return (item: IRegistryItem) => {
        return item.app === app && tags.every(tag => item.tags.includes(tag));
    };
};

export const getElasticsearchEntity = (params: IGetElasticsearchEntityParams) => {
    const { type, context } = params;

    const getByPredicate = (predicate: (item: IRegistryItem) => boolean) => {
        const item = context.db.registry.getOneItem<Entity>(predicate);
        return item.item;
    };

    switch (type) {
        case EntityType.CMS:
            return getByPredicate(createPredicate("cms", ["es"]));
        case EntityType.PAGE_BUILDER:
            return getByPredicate(createPredicate("pb", ["es"]));
        case EntityType.FORM_BUILDER:
            return getByPredicate(createPredicate("fb", ["es"]));
        case EntityType.FORM_BUILDER_SUBMISSION:
            return getByPredicate(createPredicate("fb", ["es", "form-submission"]));
    }
    throw new Error(`Unknown entity type "${type}".`);
};
