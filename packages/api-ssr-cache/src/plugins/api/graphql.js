// @flow
import gql from "graphql-tag";
import { merge } from "lodash";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/api";
import { emptyResolver } from "@webiny/api";
import LambdaClient from "aws-sdk/clients/lambda";

const REFRESH_SSR_CACHE_GQL = /* GraphQL */ `
    mutation refreshSsrCache($path: String!) {
        ssrCache {
            refreshSsrCache(path: $path) {
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

            type SsrCacheBooleanResponse {
                data: Boolean
                error: SsrCacheError
            }

            type SsrCacheQuery {
                getSsrCache(path: String!): SsrCacheResponse
                isInstalled: SsrCacheBooleanResponse
            }

            type SsrCacheMutation {
                generateSsrCache(path: String!): SsrCacheResponse
                refreshSsrCache(path: String!): SsrCacheResponse
                install(ssrGenerationUrl: String!): SsrCacheBooleanResponse
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
                getSsrCache: async (_, { path }, context) => {
                    const { SsrCache } = context.models;
                    let ssrCache = await SsrCache.findByPath(path);
                    if (!ssrCache) {
                        ssrCache = new SsrCache();
                        ssrCache.path = path;
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
                            variables: { path },
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
                },
                isInstalled: async (root: any, args: Object, context: Object) => {
                    const { SsrCacheSettings } = context.models;
                    const settings = await SsrCacheSettings.load();
                    return new Response(settings.data.installed);
                }
            },
            SsrCacheMutation: {
                refreshSsrCache: async (_, { path }, context) => {
                    const { SsrCache } = context.models;
                    let ssrCache = await SsrCache.findByPath(path);
                    if (!ssrCache) {
                        return new NotFoundResponse("SsrCache entry not found.");
                    }

                    await ssrCache.refresh();

                    return new Response(ssrCache);
                },
                generateSsrCache: async (_, { path }, context) => {
                    const { SsrCache } = context.models;
                    let ssrCache = await SsrCache.findByPath(path);
                    if (!ssrCache) {
                        ssrCache = new SsrCache();
                        ssrCache.path = path;
                        await ssrCache.save();
                    }

                    await ssrCache.refresh();

                    return new Response(ssrCache);
                },

                install: async (root: any, args: Object, context: Object) => {
                    // Start the download of initial Page Builder page / block images.
                    const { SsrCacheSettings } = context.models;

                    try {
                        let settings = await SsrCacheSettings.load();
                        if (await settings.data.installed) {
                            return new ErrorResponse({
                                code: "SSR_CACHE_INSTALL_ABORTED",
                                message: "SSR Cache is already installed."
                            });
                        }

                        settings.data.ssrGenerationUrl = args.ssrGenerationUrl;
                        settings.data.installed = true;
                        await settings.save();
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse({
                            code: "SSR_CACHE_INSTALL_ERROR",
                            message: e.message
                        });
                    }
                }
            }
        })
    }
};
