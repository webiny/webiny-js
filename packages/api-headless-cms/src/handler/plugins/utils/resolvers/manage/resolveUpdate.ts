import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { entryNotFound } from "./../entryNotFound";
import { setContextLocale } from "./../../setContextLocale";
import { findEntry } from "../../findEntry";

export const resolveUpdate = ({ model }): GraphQLFieldResolver<any, any, CmsContext> => async (
    root,
    args,
    context
) => {
    setContextLocale(context, args.locale);

    try {
        let instance;
        // For the MANAGE API, we also allow getting entries directly by ID.
        if (context.cms.MANAGE && args.where && args.where.id) {
            const Model = context.models[model.modelId];
            instance = await Model.findById(args.where.id);
        } else {
            instance = await findEntry({ model, args, context });
        }

        if (!instance) {
            return entryNotFound(JSON.stringify(args.where));
        }

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
