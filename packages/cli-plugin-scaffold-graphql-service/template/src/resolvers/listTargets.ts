import { ListErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext, ListResolverResponse, ListTargetsArgs, Target } from "../types";

interface GetResultSizeArgs {
    limit?: number;
    maxLimit?: number;
    defaultLimit?: number;
}
const getResultSize = (args: GetResultSizeArgs): number => {
    const { limit, maxLimit = 1000, defaultLimit = 50 } = args;
    if (!limit || limit <= 0) {
        return defaultLimit;
    } else if (limit >= maxLimit) {
        return maxLimit;
    }
    return limit;
};

const listTargets = async (
    _,
    args: ListTargetsArgs,
    context: ApplicationContext
): Promise<ListResolverResponse<Target>> => {
    const { sort, limit, after } = args;
    const size = getResultSize({ limit });

    let response;
    // TODO: use DynamoDB
    response = await db.search({
        ...utils.es(context),
        body
    });

    /**
     * The response we get we transform to the one we can work with.
     */
    const { hits, total } = response.body.hits;
    const items = hits.map((item: any) => item._source);
    /**
     * If there are more records than requested size, remove the last one as it was not requested.
     * But it helps us to check if there are more records to be fetched.
     */
    const hasMoreItems = items.length > size;
    if (hasMoreItems) {
        items.pop();
    }
    const meta = {
        hasMoreItems,
        totalCount: total.value,
        // TODO: use DynamoDB cursors
        // cursor: items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null
    };

    return new ListResponse(items, meta);
};

export default listTargets;
