import { ListResponse, ListErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/api/types";
import findEntries from "./findEntries";

export const resolveList = ({ model }): GraphQLFieldResolver => async (
    entry,
    args,
    context,
    info
) => {
    try {
        const { entries, meta } = await findEntries({ model, args, context, info });
        return new ListResponse(entries, meta);
    } catch (err) {
        return new ListErrorResponse({ code: err.code || "RESOLVE_LIST", message: err.message });
    }
};
