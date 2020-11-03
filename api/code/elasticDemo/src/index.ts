import gql from "graphql-tag";
import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import { listElasticProducts } from "./listElasticProducts";
import { createElasticProduct } from "./createElasticProduct";

export const handler = createHandler(
    apolloServerPlugins({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),
    elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
    {
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type ElasticProduct {
                    id: ID
                    title: String
                    description: String
                    price: Int
                    createdOn: DateTime
                }

                input ElasticProductInput {
                    title: String
                    price: Int
                    description: String
                }

                input ElasticProductWhere {
                    exact_title: String
                    title_contains: String
                    description_contains: String
                    price_gt: Int
                    price_lt: Int
                }

                enum ElasticProductSort {
                    CREATED_ON_ASC
                    CREATED_ON_DESC
                    PRICE_ASC
                    PRICE_DESC
                }

                extend type Query {
                    listElasticProducts(
                        where: ElasticProductWhere
                        sort: ElasticProductSort
                    ): [ElasticProduct]
                }

                extend type Mutation {
                    createElasticProduct(data: ElasticProductInput): Boolean
                }
            `,
            resolvers: {
                Query: {
                    listElasticProducts
                },
                Mutation: {
                    createElasticProduct
                }
            }
        }
    }
);
