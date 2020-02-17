import { ListResponse, ListErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/api/types";
import { setContextLocale } from "./setContextLocale";
import findEntries from "./findEntries";

export const resolveList = ({ model }): GraphQLFieldResolver => async (entry, args, context) => {
    setContextLocale(context, args.locale);
    try {
        const entries = await findEntries({ model, args, context });
        return new ListResponse(entries, entries.getMeta());
    } catch (err) {
        return new ListErrorResponse({ code: err.code || "RESOLVE_LIST", message: err.message });
    }
};
