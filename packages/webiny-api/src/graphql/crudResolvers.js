// @flow
import { ModelError } from "webiny-model";
import type { Entity, EntityCollection } from "webiny-entity";
import parseBoolean from "./parseBoolean";
import InvalidAttributesError from "./InvalidAttributesError";
import { ListResponse, ErrorResponse, Response } from "./responses";

type EntityFetcher = (context: Object) => Class<Entity>;

const notFound = (id?: string) =>
    new ErrorResponse({
        code: "NOT_FOUND",
        message: id ? `Record "${id}" not found!` : "Record not found!"
    });

export const resolveGet = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);

    if (args.id) {
        const entity = await entityClass.findById(args.id);
        if (!entity) {
            return notFound(args.id);
        }
        return new Response(entity);
    }

    const entity = await entityClass.findOne({ query: args.where, sort: args.sort });

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
    const entityClass = entityFetcher(context);

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

    const data: EntityCollection<Entity> = await entityClass.find(find);

    return new ListResponse(data, data.getMeta());
};

export const resolveCreate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);
    const entity = new entityClass();

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
    const entityClass = entityFetcher(context);
    const entity = await entityClass.findById(args.id);
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
    const entityClass = entityFetcher(context);
    const entity = await entityClass.findById(args.id);
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
