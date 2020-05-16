import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export const resolveCreate = ({ model }): GraphQLFieldResolver => async (root, args, context) => {
    try {
        const Model = context.models[model.modelId];
        const instance = new Model();
        instance.populate(args.data);
        await instance.save();
        return new Response(instance);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
