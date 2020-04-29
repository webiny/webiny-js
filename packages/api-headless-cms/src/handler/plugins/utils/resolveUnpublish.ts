import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { entryNotFound } from "./entryNotFound";
import { CmsGraphQLContext } from "@webiny/api-headless-cms/types";

export const resolveUnpublish = ({
    model
}): GraphQLFieldResolver<any, any, CmsGraphQLContext> => async (root, args, context) => {
    const Model = context.models[model.modelId];
    const instance = await Model.find({ query: { id: args.revision } });

    if (!instance) {
        return entryNotFound(JSON.stringify(args.where));
    }

    if (!instance.meta.published) {
        return new ErrorResponse({
            code: "CONTENT_MODEL_ENTRY_NOT_PUBLISHED",
            message: "Cannot unpublish content model entry (not published)."
        });
    }

    try {
        instance.meta.published = false;
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
