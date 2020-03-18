import { ListResponse, ListErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLFieldResolver, GraphQLContext as APIContext } from "@webiny/api/types";
import { setContextLocale } from "./setContextLocale";
import findEntries from "./findEntries";

export const resolveList = ({
    model
}): GraphQLFieldResolver<any, any, APIContext & I18NContext> => async (entry, args, context) => {
    setContextLocale(context, args.locale);
    try {
        const { entries, meta } = await findEntries({ model, args, context });
        return new ListResponse(entries, meta);
    } catch (err) {
        return new ListErrorResponse({ code: err.code || "RESOLVE_LIST", message: err.message });
    }
};
