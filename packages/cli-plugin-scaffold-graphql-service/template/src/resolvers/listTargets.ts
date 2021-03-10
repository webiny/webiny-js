import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import {
    createElasticsearchQuery,
    encodeElasticsearchCursor,
    decodeElasticsearchCursor,
    createElasticsearchSort
} from "../es";
import { ApplicationContext, ListResolverResponse, ListTargetsArgs, Target } from "../types";

const listTargets = async (
    _,
    args: ListTargetsArgs,
    context: ApplicationContext
): Promise<ListResolverResponse<Target>> => {
    const { elasticSearch } = context;
    const { where, sort, limit, after } = args;

    const size = !limit || limit <= 0 || limit >= 1000 ? 50 : limit;

    const body = {
        query: createElasticsearchQuery(where),
        sort: createElasticsearchSort(sort),
        // we always take one extra to see if there are more items to be fetched
        size: size + 1,
        // eslint-disable-next-line
        search_after: decodeElasticsearchCursor(after) || undefined
    };

    let response;
    try {
        response = await elasticSearch.search({
            ...configuration.es(context),
            body
        });
    } catch (ex) {
        return new ErrorResponse({
            code: ex.code || "ELASTICSEARCH_ERROR",
            message: ex.message,
            data: ex
        });
    }
    const { hits, total } = response.body.hits;

    const items = hits.map((item: any) => item._source);

    const hasMoreItems = items.length > size;
    if (hasMoreItems) {
        // Remove the last item from results, we don't want to include it.
        items.pop();
    }

    const meta = {
        hasMoreItems,
        totalCount: total.value,
        cursor: items.length > 0 ? encodeElasticsearchCursor(hits[items.length - 1].sort) : null
    };

    return new ListResponse(items, meta);
};

export default listTargets;
