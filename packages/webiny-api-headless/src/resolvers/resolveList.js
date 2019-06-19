import { ListResponse } from "webiny-api/graphql";
import findEntries from "webiny-api-headless/utils/findEntries";

export const resolveList = ({ model }: Object) => async (
    entry: any,
    args: Object,
    context: Object
) => {
    const { entries, meta } = await findEntries({ model, args, context });
    return new ListResponse(entries, meta);
};
