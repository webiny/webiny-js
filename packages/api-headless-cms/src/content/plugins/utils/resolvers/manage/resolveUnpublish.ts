import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { entryNotFound } from "./../entryNotFound";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { setContextLocale } from "./../../setContextLocale";

export const resolveUnpublish = ({ model }): GraphQLFieldResolver<any, any, CmsContext> => async (
    root,
    args,
    context
) => {
    setContextLocale(context, args.locale);

    const Model = context.models[model.modelId];
    const instance = await Model.findById(args.revision);
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
