// @flow
import type { Entity } from "@webiny/entity";

type EntityFetcher = string | ((context: Object) => Class<Entity>);

export default (context: Object, entityFetcher: EntityFetcher) => {
    if (typeof entityFetcher === "string") {
        const entityClass = context.getEntity(entityFetcher);
        if (!entityClass) {
            throw Error(`Cannot get "${entityFetcher}" entity.`);
        }
        return entityClass;
    }
    return entityFetcher(context);
};
