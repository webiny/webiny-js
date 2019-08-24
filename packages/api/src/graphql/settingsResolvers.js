// @flow
import type { Entity } from "@webiny/entity";
import { ErrorResponse } from "./responses";
import getEntityClass from "./getEntityClass";
type EntityFetcher = string | ((context: Object) => Class<Entity>);

export const resolveGetSettings = (entityFetcher: EntityFetcher) => async (
    _: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);
    let settings = await EntityClass.load();
    if (!settings) {
        settings = new EntityClass();
        await settings.save();
    }

    return settings;
};

export const resolveUpdateSettings = (entityFetcher: EntityFetcher) => async (
    _: any,
    args: Object,
    context: Object
) => {
    const { data } = args;
    const EntityClass = getEntityClass(context, entityFetcher);
    let settings = await EntityClass.load();
    if (!settings) {
        settings = new EntityClass();
    }

    if (!settings.data) {
        settings.data = {};
    }

    try {
        settings.data.populate(data);
        await settings.save();
        return settings;
    } catch (e) {
        return new ErrorResponse(e);
    }
};
