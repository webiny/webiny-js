import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const response = await context.elasticSearch.search({
        index: "file-manager",
        body: {
            size: 0,
            aggs: {
                listTags: {
                    terms: { field: "tags.keyword" }
                }
            }
        }
    });

    return response?.body?.aggregations?.listTags?.buckets.map(item => item.key);
};

export default resolver;
