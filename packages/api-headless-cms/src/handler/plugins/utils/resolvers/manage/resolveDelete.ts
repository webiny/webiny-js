import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { entryNotFound } from "./../entryNotFound";

export const resolveDelete = ({ model }): GraphQLFieldResolver<any, any, CmsContext> => async (
    root,
    args,
    context
) => {
    const Model = context.models[model.modelId];
    const instance = await Model.findOne(args.where);
    if (!instance) {
        return entryNotFound(JSON.stringify(args.where));
    }

    try {
        await instance.delete();
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
