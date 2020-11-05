import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { ErrorResponse } from "@webiny/graphql";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const must = [];
        const { i18nContent } = context;
        if (i18nContent?.locale?.code) {
            must.push({
                term: {
                    "locale.keyword": i18nContent.locale.code
                }
            });
        }

        const response = await context.elasticSearch.search({
            index: "file-manager",
            body: {
                query: {
                    bool: {
                        must
                    }
                },
                size: 0,
                aggs: {
                    listTags: {
                        terms: { field: "tags.keyword" }
                    }
                }
            }
        });

        return response?.body?.aggregations?.listTags?.buckets?.map(item => item.key) || [];
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
