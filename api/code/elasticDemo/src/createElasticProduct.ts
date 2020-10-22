import KSUID from "ksuid";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Context as ElasticSearchContext } from "@webiny/api-plugin-elastic-search-client/types";

export const createElasticProduct: GraphQLFieldResolver<any, any, ElasticSearchContext> = async (
    _,
    { data },
    context
) => {
    const id = KSUID.randomSync().string;
    try {
        await context.elasticSearch.create({
            id,
            index: "demo-products",
            type: "_doc",
            body: {
                id,
                createdOn: new Date().toISOString(),
                title: data.title,
                description: data.description,
                price: data.price
            }
        });
    } catch (err) {
        console.log(err);
        return false;
    }
    return true;
};
