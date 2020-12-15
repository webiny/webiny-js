import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";
import findEntries from "../findEntries";

export const resolveList: ResolverFactory = ({ model }) => async (root, args, context, info) => {
    try {
        const { entries, meta } = await findEntries({ model, args, context, info });
        return new ListResponse(entries, meta);
    } catch (err) {
        return new ListErrorResponse({ code: err.code || "RESOLVE_LIST", message: err.message });
    }
};
