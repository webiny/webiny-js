import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { entryNotFound } from "./../entryNotFound";
import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";
import { setContextLocale } from "./../../setContextLocale";

export const resolvePublish = ({
    model
}: {
    model: CmsContentModelType;
}): GraphQLFieldResolver<any, any, CmsContext> => async (root, args, context) => {
    setContextLocale(context, args.locale);

    const Model = context.models[model.modelId];
    const instance = await Model.findById(args.revision);
    if (!instance) {
        return entryNotFound(JSON.stringify(args.where));
    }

    if (instance.meta.published) {
        return new ErrorResponse({
            code: "CONTENT_MODEL_ENTRY_ALREADY_PUBLISHED",
            message: "Cannot publish content model entry (already published)."
        });
    }

    try {
        instance.meta.published = true;
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
