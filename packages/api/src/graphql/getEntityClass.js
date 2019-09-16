// @flow
import type { Entity } from "@webiny/entity";

type EntityFetcher = string | ((context: Object) => Class<Entity>);

// TODO: remove this once models are in place.
const getEntity = (context: Object, entityFetcher: EntityFetcher) => {
    if (typeof entityFetcher === "string") {
        const entityClass = context.getEntity(entityFetcher);
        if (!entityClass) {
            throw Error(`Cannot get "${entityFetcher}" entity.`);
        }
        return entityClass;
    }
    return entityFetcher(context);
};

const getModel = (context: Object, entityFetcher: EntityFetcher) => {
    if (typeof entityFetcher === "string") {
        const entityClass = context.getModel(entityFetcher);
        if (!entityClass) {
            throw Error(`Cannot get "${entityFetcher}" entity.`);
        }
        return entityClass;
    }
    return entityFetcher(context);
};

export default (...args) => {
    const entityClass = getEntity(...args);
    if (entityClass) {
        return entityClass;
    }

    return getModel(...args);
};
