// @flow
import { WithFieldsError } from "@commodo/fields";
import parseBoolean from "./parseBoolean";
import InvalidFieldsError from "./InvalidFieldsError";
import { ListResponse, ErrorResponse, NotFoundResponse, Response } from "./responses";

type GetModelType = (context: Object) => Function;

const notFound = (id?: string) => {
    return new NotFoundResponse(id ? `Record "${id}" not found!` : "Record not found!");
};

export const resolveGet = (getModel: GetModelType) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = getModel(context);

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

export const resolveList = (getModel: GetModelType) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = getModel(context);

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

    const data = await Model.find(find);

    return new ListResponse(data, data.getMeta());
};

export const resolveCreate = (getModel: GetModelType) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = getModel(context);
    const model = new Model();

    try {
        await model.populate(args.data).save();
    } catch (e) {
        if (
            e instanceof WithFieldsError &&
            e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS
        ) {
            const fieldError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: fieldError.code || "VALIDATION_FAILED_INVALID_FIELDS",
                message: fieldError.message,
                data: fieldError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
    return new Response(model);
};

export const resolveUpdate = (getModel: GetModelType) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = getModel(context);
    const model = await Model.findById(args.id);
    if (!model) {
        return notFound(args.id);
    }

    try {
        await model.populate(args.data);
        await model.save();
    } catch (e) {
        if (
            e instanceof WithFieldsError &&
            e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS
        ) {
            const fieldError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: fieldError.code || "VALIDATION_FAILED_INVALID_FIELDS",
                message: fieldError.message,
                data: fieldError.data
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

export const resolveDelete = (getModel: GetModelType) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Model = getModel(context);
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

export default (modelClass: Function, include: Array<string>) => {
    const resolvers = {};

    include.forEach(name => {
        resolvers[name] = resolveMap[name](modelClass);
    });

    return resolvers;
};
