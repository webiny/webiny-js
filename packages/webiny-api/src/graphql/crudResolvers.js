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
        message: id ? `Entity with id "${id}" was not found!` : "Entity not found!"
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
    if (args.search && args.search.query) {
        query.$search = {
            query: args.search.query,
            columns: args.search.fields,
            operator: args.search.operator || "or"
        };
    }

    const data: EntityCollection = await entityClass.find({
        query,
        page: args.page,
        perPage: args.perPage,
        sort: args.sort
    });

    const meta = data.getParams();
    meta.count = data.length;
    meta.totalCount = data.getMeta().totalCount;
    meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
    meta.to = (meta.page - 1) * meta.perPage + meta.count;
    meta.from = meta.to - meta.count + 1;
    meta.nextPage = meta.page < meta.totalPages ? meta.page + 1 : null;
    meta.previousPage = meta.page === 1 ? null : meta.page - 1;

    return new ListResponse(data, meta);
};

export const resolveCreate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);
    const entity = new entityClass();

    if (!entity) {
        return notFound(args.id);
    }

    try {
        console.log(args.data)
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

    await entity.delete();
    return new Response(true);
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
