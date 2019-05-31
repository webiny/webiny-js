// @flow
import { ModelError } from "webiny-model";
import type { Entity, EntityCollection } from "webiny-entity";
import parseBoolean from "./parseBoolean";
import InvalidAttributesError from "./InvalidAttributesError";
import { ListResponse, ErrorResponse, NotFoundResponse, Response } from "./responses";

type EntityFetcher = string | (context: Object) => Class<Entity>;

const notFound = (id?: string) => {
    return new NotFoundResponse(id ? `Record "${id}" not found!` : "Record not found!");
};

const getEntityClass = (context, entityFetcher) => {
    if (typeof entityFetcher === "string") {
        const entityClass = context.getEntity(entityFetcher);
        if (!entityClass) {
            throw Error(`Cannot get "${entityFetcher}" entity.`);
        }
        return entityClass;
    }
    return entityFetcher(context);
};

export const resolveGet = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);

    if (args.id) {
        const entity = await EntityClass.findById(args.id);
        if (!entity) {
            return notFound(args.id);
        }
        return new Response(entity);
    }

    const entity = await EntityClass.findOne({ query: args.where, sort: args.sort });

    if (!entity) {
        return notFound();
    }
    return new Response(entity);
};

export const resolveList = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);

    parseBoolean(args);

    const query = { ...args.where };
    const find: Object = {
        query,
        page: args.page,
        perPage: args.perPage,
        sort: args.sort
    };

    if (args.search && args.search.query) {
        find.search = {
            query: args.search.query,
            fields: args.search.fields,
            operator: args.search.operator || "or"
        };
    }

    const data: EntityCollection<Entity> = await EntityClass.find(find);

    return new ListResponse(data, data.getMeta());
};

export const resolveCreate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);
    const entity = new EntityClass();

    try {
        await entity.populate(args.data).save();
    } catch (e) {
        if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
            const attrError = InvalidAttributesError.from(e);
            return new ErrorResponse({
                code: attrError.code || "INVALID_ATTRIBUTES",
                message: attrError.message,
                data: attrError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
    return new Response(entity);
};

export const resolveUpdate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);
    const entity = await EntityClass.findById(args.id);
    if (!entity) {
        return notFound(args.id);
    }

    try {
        await entity.populate(args.data).save();
    } catch (e) {
        if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
            const attrError = InvalidAttributesError.from(e);
            return new ErrorResponse({
                code: attrError.code || "INVALID_ATTRIBUTES",
                message: attrError.message,
                data: attrError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
    return new Response(entity);
};

export const resolveDelete = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const EntityClass = getEntityClass(context, entityFetcher);
    const entity = await EntityClass.findById(args.id);
    if (!entity) {
        return notFound(args.id);
    }

    return entity
        .delete()
        .then(() => new Response(true))
        .catch(
            e =>
                new ErrorResponse({
                    code: e.code,
                    message: e.message
                })
        );
};

const resolveMap = {
    get: resolveGet,
    list: resolveList,
    create: resolveCreate,
    update: resolveUpdate,
    delete: resolveDelete
};

export default (entityClass: Class<Entity>, include: Array<string>) => {
    const resolvers = {};

    include.forEach(name => {
        resolvers[name] = resolveMap[name](entityClass);
    });

    return resolvers;
};
