import { ListResponse, ListErrorResponse } from "@webiny/api/graphql";
import findEntries from "@webiny/api-headless/utils/findEntries";

export const resolveList = ({ model }: Object) => async (
    entry: any,
    args: Object,
    context: Object,
    info: Object
) => {
    try {
        const { entries, meta } = await findEntries({ model, args, context, info });
        return new ListResponse(entries, meta);
    } catch (err) {
        return new ListErrorResponse({ code: err.code || "RESOLVE_LIST", error: err.message });
    }
};
