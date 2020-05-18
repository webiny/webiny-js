import { Response } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { findEntry } from "../findEntry";
import { setContextLocale } from "../setContextLocale";
import { entryNotFound } from "./entryNotFound";

export const resolveGet = ({ model }): GraphQLFieldResolver<any, any, CmsContext> => async (
    root,
    args,
    context
) => {
    setContextLocale(context, args.locale);

    let instance;
    // For the MANAGE API, we also allow getting entries directly by ID.
    if (context.cms.MANAGE && args.where && args.where.id) {
        const Model = context.models[model.modelId];
        instance = await Model.findById(args.where.id);
    } else {
        instance = await findEntry({ model, args, context });
    }

    if (!instance) {
        return entryNotFound();
    }

    return new Response(instance);
};
