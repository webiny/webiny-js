// @flow
import gql from "graphql-tag";
import { merge } from "lodash";
import { hasScope } from "@webiny/api-security";
import { NotFoundResponse, Response } from "@webiny/api";
import { emptyResolver } from "@webiny/api";

export default {
    type: "graphql-schema",
    name: "graphql-schema-page-builder",
    schema: {
        typeDefs: gql`
            type Cache {
                id: String
                content: String
                refreshedOn: DateTime
                expiresOn: DateTime
                expiresIn: Int
                hasExpired: Boolean
            }

            type CacheResponse {
                data: Cache
                error: CacheError
            }

            type CacheError {
                code: String
                message: String
                data: JSON
            }

            type CacheQuery {
                getByKey(key: String!): CacheResponse
            }

            type CacheMutation {
                invalidateByKey(key: String!): CacheResponse
                refreshByKey(key: String!): CacheResponse
            }

            extend type Query {
                cache: CacheQuery
            }

            extend type Mutation {
                cache: CacheMutation
            }
        `,
        resolvers: merge({
            Query: {
                cache: emptyResolver
            },
            CacheQuery: {
                getByKey: async (_, args, context) => {
                    console.log("owwaaaaaaaa");
                    const { Cache } = context.models;
                    const cache = await Cache.findByKey(args.key);
                    if (!cache) {
                        console.log("idemo van");
                        return new NotFoundResponse("Cache entry not found.");
                    }

                    return new Response(await Cache.findByKey(args.key));
                }
            },
            Mutation: {
                cache: emptyResolver
            },
            CacheMutation: {
                invalidateByKey: async (_, args, context) => {
                    const { Cache } = context.models;
                    const cache = await Cache.findByKey(args.key);
                    if (!cache) {
                        return new NotFoundResponse("Cache entry not found.");
                    }

                    await cache.invalidate();
                    return new Response(await Cache.findByKey(args.key));
                },
                refreshByKey: async (_, args, context) => {
                    const { Cache } = context.models;
                    let cache = await Cache.findByKey(args.key);
                    if (!cache) {
                        cache = new Cache();
                        cache.key = args.key;
                        await cache.save();
                    }

                    await cache.refresh();

                    await cache.save();

                    return new Response(await Cache.findByKey(args.key));
                }
            }
        })
    },
    security: {
        shield: {
            CacheQuery: {
                // getByKey: hasScope("cache:get") // Leave publicly available.
            },
            CacheMutation: {
                // refreshByKey: hasScope("cache:refresh"), // Leave publicly available.
                invalidateByKey: hasScope("cache:invalidate")
            }
        }
    }
};
