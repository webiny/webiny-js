import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Context as ElasticSearchContext } from "@webiny/api-plugin-elastic-search-client/types";

/* Dirty setup just to test Elastic*/
const sorters = {
    CREATED_ON_ASC: { createdOn: "asc" },
    CREATED_ON_DESC: { createdOn: "desc" },
    PRICE_ASC: { price: "asc" },
    PRICE_DESC: { price: "desc" }
};

type ListProducts = GraphQLFieldResolver<any, any, ElasticSearchContext>;

export const listElasticProducts: ListProducts = async (_, args, context) => {
    const conditions = [];

    if (args.where) {
        if (args.where.exact_title) {
            conditions.push({
                term: {
                    "title.keyword": args.where.exact_title
                }
            });
        }

        if (args.where.title_contains) {
            conditions.push({
                wildcard: {
                    title: `*${args.where.title_contains}*`
                }
            });
        }

        if (args.where.description_contains) {
            conditions.push({
                wildcard: {
                    description: `*${args.where.description_contains}*`
                }
            });
        }

        if (args.where.price_gt) {
            conditions.push({
                range: {
                    price: { gt: args.where.price_gt }
                }
            });
        }

        if (args.where.price_lt) {
            conditions.push({
                range: {
                    price: { lt: args.where.price_gt }
                }
            });
        }
    }
    const response = await context.elasticSearch.search({
        index: "demo-products",
        type: "_doc",
        body: {
            query: {
                bool: {
                    // `must` means `and`; all conditions must be satisfied for a record to be present in the result
                    must: conditions
                }
            },
            sort: [sorters[args.sort] || sorters.CREATED_ON_DESC]
        }
    });

    console.log("elastic response", response);

    // @ts-ignore
    return response.body.hits.hits.map(item => item._source);
};

// GET /demo-products/_search
// {
//     "query": {
//         "bool": {
//             "must": [
//                 {
//                     "wildcard": {
//                         "title": "*prod*"
//                     }
//                 },
//                 {
//                     "range": {
//                         "price": {
//                             "gte": 180
//                         }
//                     }
//                 }
//             ]
//         }
//     },
//     "sort": [{ "price": "asc"}]
// }
