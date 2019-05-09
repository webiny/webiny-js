// @flow
import { ModelError } from "webiny-model";
import { WithFieldsError } from "@commodo/fields";
import type { Entity, EntityCollection } from "webiny-entity";
import parseBoolean from "./parseBoolean";
import InvalidAttributesError from "./InvalidAttributesError";
import { ListResponse, ErrorResponse, NotFoundResponse, Response } from "./responses";

type EntityFetcher = (context: Object) => Class<Entity>;

const notFound = (id?: string) => {
    return new NotFoundResponse(id ? `Record "${id}" not found!` : "Record not found!");
};

export const resolveGet = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = entityFetcher(context);

    if (args.id) {
        const model = await Model.findById(args.id);
        if (!model) {
            return notFound(args.id);
        }
        return new Response(model);
    }

    const model = await Model.findOne({ query: args.where, sort: args.sort });
    if (!model) {
        return notFound();
    }
    return new Response(model);
};

export const resolveList = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = entityFetcher(context);

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

    const collection: EntityCollection<Entity> = await Model.find(find);

    return new ListResponse(collection, collection.getMeta());
};

export const resolveCreate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = entityFetcher(context);
    const model = new Model();

    try {
        console.log(args.data)
        const hop = args.data.hasOwnProperty
        await model.populate(args.data);
        await model.save();
    } catch (e) {
        console.log(JSON.stringify(e.data, null, 2))
        // TODO: test with invalid fields, make sure they are returned in API responses.
        /*if (e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            const attrError = InvalidAttributesError.from(e);
            return new ErrorResponse({
                code: attrError.code || "INVALID_ATTRIBUTES",
                message: attrError.message,
                data: attrError.data
            });
        }*/
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
    return new Response(model);
};

export const resolveUpdate = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = entityFetcher(context);
    const model = await Model.findById(args.id);
    if (!model) {
        return notFound(args.id);
    }

    try {
        await model.populate(args.data).save();
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
    return new Response(model);
};

export const resolveDelete = (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = entityFetcher(context);
    const model = await Model.findById(args.id);
    if (!model) {
        return notFound(args.id);
    }

    return model
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
