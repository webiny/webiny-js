// @flow
import gql from "graphql-tag";
import { merge } from "lodash";
import { NotFoundResponse, Response } from "@webiny/api";
import { emptyResolver } from "@webiny/api";
import LambdaClient from "aws-sdk/clients/lambda";

const REFRESH_SSR_CACHE_GQL = /* GraphQL */ `
    mutation refreshSsrCache($key: String!) {
        ssrCache {
            refreshSsrCache(key: $key) {
                error {
                    message
                }
            }
        }
    }
`;

export default {
    type: "graphql-schema",
    name: "graphql-schema-page-builder",
    schema: {
        typeDefs: gql`
            type SsrCacheLastRefresh {
                start: DateTime
                end: DateTime
                duration: Int
            }

            type SsrCache {
                id: String
                content: String
                refreshedOn: DateTime
                lastRefresh: SsrCacheLastRefresh
                expiresOn: DateTime
                expiresIn: Int
                hasExpired: Boolean
            }

            type SsrCacheError {
                code: String
                message: String
                data: JSON
            }

            type SsrCacheResponse {
                data: SsrCache
                error: SsrCacheError
            }

            type SsrCacheQuery {
                getSsrCache(key: String!): SsrCacheResponse
            }

            type SsrCacheMutation {
                refreshSsrCache(key: String!): SsrCacheResponse
            }

            extend type Query {
                ssrCache: SsrCacheQuery
            }

            extend type Mutation {
                ssrCache: SsrCacheMutation
            }
        `,
        resolvers: merge({
            Query: {
                ssrCache: emptyResolver
            },
            Mutation: {
                ssrCache: emptyResolver
            },
            SsrCacheQuery: {
                getSsrCache: async (_, { key }, context) => {
                    const { SsrCache } = context.models;
                    let ssrCache = await SsrCache.findByKey(key);
                    if (!ssrCache) {
                        ssrCache = new SsrCache();
                        ssrCache.key = key;
                        await ssrCache.save();
                    }

                    if (ssrCache.isEmpty) {
                        await ssrCache.refresh();
                        return new Response(ssrCache);
                    }

                    if (ssrCache.hasExpired) {
                        await ssrCache.incrementExpiresOn().save();

                        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                        const body = JSON.stringify({
                            operationName: "refreshSsrCache",
                            variables: { key },
                            query: REFRESH_SSR_CACHE_GQL
                        });

                        await Lambda.invoke({
                            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            InvocationType: "Event",
                            Payload: JSON.stringify({
                                httpMethod: "POST",
                                body
                            })
                        }).promise();
                    }

                    return new Response(ssrCache);
                }
            },
            SsrCacheMutation: {
                refreshSsrCache: async (_, { key }, context) => {
                    const { SsrCache } = context.models;
                    let ssrCache = await SsrCache.findByKey(key);
                    if (!ssrCache) {
                        return new NotFoundResponse("SsrCache entry not found.");
                    }

                    await ssrCache.refresh();

                    return new Response(ssrCache);
                }
            }
        })
    }
};
