// @flow
import gql from "graphql-tag";
import { merge } from "lodash";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/api";
import { emptyResolver } from "@webiny/api";
import LambdaClient from "aws-sdk/clients/lambda";

const GENERATE_SSR_CACHE_GQL = /* GraphQL */ `
    mutation generateSsrCache($path: String!) {
        ssrCache {
            generateSsrCache(path: $path) {
                error {
                    message
                }
            }
        }
    }
`;

const INVALIDATE_SSR_CACHE_GQL = /* GraphQL */ `
    mutation invalidateSsrCache($path: String!) {
        ssrCache {
            invalidateSsrCache(path: $path) {
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
                startedOn: DateTime
                endedOn: DateTime
                duration: Int
            }

            type SsrCache {
                id: String
                content: String
                refreshedOn: DateTime
                lastRefresh: SsrCacheLastRefresh
                expiresOn: DateTime
                expiresIn: Long
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

            input TagsInput {
                class: String
                id: String
            }

            type SsrCacheMutation {
                generateSsrCache(path: String!): SsrCacheResponse
                invalidateSsrCache(path: String, tags: [TagsInput]): SsrCacheBooleanResponse
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
                            operationName: "generateSsrCache",
                            variables: { path },
                            query: GENERATE_SSR_CACHE_GQL
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
                generateSsrCache: async (_, { path, async }, context) => {
                    if (async === true) {
                        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                        const body = JSON.stringify({
                            operationName: "generateSsrCache",
                            variables: { path },
                            query: GENERATE_SSR_CACHE_GQL
                        });

                        return await Lambda.invoke({
                            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            InvocationType: "Event",
                            Payload: JSON.stringify({
                                httpMethod: "POST",
                                body
                            })
                        }).promise();
                    }

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
                invalidateSsrCache: async (_, { path, tags, async }, context) => {
                    if (async) {
                        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                        const body = JSON.stringify({
                            operationName: "invalidateSsrCache",
                            variables: { path, tags, async },
                            query: INVALIDATE_SSR_CACHE_GQL
                        });

                        return await Lambda.invoke({
                            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            InvocationType: "Event",
                            Payload: JSON.stringify({
                                httpMethod: "POST",
                                body
                            })
                        }).promise();
                    }

                    const { SsrCache } = context.models;
                    if (path) {
                        let ssrCache = await SsrCache.findByPath(path);
                        if (!ssrCache) {
                            return new NotFoundResponse("SsrCache entry not found.");
                        }

                        await ssrCache.invalidate();
                        return new Response(true);
                    }

                    if (!tags) {
                        return new ErrorResponse(
                            `"path" nor "tags" were passed, please provide one.`
                        );
                    }

                    const deletePromises = [];
                    for (let i = 0; i < tags.length; i++) {
                        deletePromises.push(new Promise(async (resolve) => {
                            let tag = tags[i];
                            let $elemMatch = {};
                            if (tag.class) {
                                $elemMatch.class = tag.class;
                            }

                            if (tag.id) {
                                $elemMatch.id = tag.id;
                            }

                            let ssrCaches = await SsrCache.find({
                                query: {
                                    cacheTags: { $elemMatch }
                                }
                            });

                            for (let i = 0; i < ssrCaches.length; i++) {
                                let ssrCache = ssrCaches[i];
                                await ssrCache.invalidate();
                            }

                            resolve();
                        }))
                    }

                    await Promise.all(deletePromises);

                    return new Response(true);
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
