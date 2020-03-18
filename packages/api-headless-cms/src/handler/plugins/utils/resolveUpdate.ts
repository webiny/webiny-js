import { GraphQLFieldResolver } from "@webiny/api/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { findEntry } from "./findEntry";
import { entryNotFound } from "./entryNotFound";
import { setContextLocale } from "./setContextLocale";
import { CmsGraphQLContext } from "@webiny/api-headless-cms/types";

export const resolveUpdate = ({
    model
}): GraphQLFieldResolver<any, any, CmsGraphQLContext> => async (root, args, context) => {
    setContextLocale(context, args.locale);
    const instance = await findEntry({ model, args, context });

    if (!instance) {
        return entryNotFound(JSON.stringify(args.where));
    }

    try {
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
