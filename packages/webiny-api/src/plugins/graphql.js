// @flow
import { type GraphQLSchemaPluginType } from "webiny-api/types";
import { gql } from "apollo-server-lambda";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLLong from "graphql-type-long";
import { dummyResolver } from "../graphql";

export default ({
    type: "graphql-schema",
    name: "graphql-schema-api",
    schema: {
        namespace: "api",
        typeDefs: gql`
            scalar JSON
            scalar DateTime
            scalar Long

            input SearchInput {
                query: String
                fields: [String]
                operator: String
            }

            type ListMeta {
                totalCount: Int
                totalPages: Int
                page: Int
                perPage: Int
                from: Int
                to: Int
                previousPage: Int
                nextPage: Int
            }

            type Error {
                code: String
                message: String
                data: JSON
            }

            type DeleteResponse {
                data: Boolean
                error: Error
            }

            type SettingsQuery {
                _empty: String
            }

            type SettingsMutation {
                _empty: String
            }

            type Query {
                settings: SettingsQuery
            }

            type Mutation {
                settings: SettingsMutation
            }
        `,
        resolvers: {
            Long: GraphQLLong,
            JSON: GraphQLJSON,
            DateTime: GraphQLDateTime,
            Query: {
                settings: dummyResolver
            },
            Mutation: {
                settings: dummyResolver
            }
        }
        /*resolvers: () => [
            {
                Query: {
                    settings: dummyResolver
                },
                Mutation: {
                    settings: dummyResolver
                }
            },
            ...getPlugins("schema-settings").map(plugin => {
                return {
                    SettingsQuery: {
                        [plugin.namespace]: async (_: any, args: Object, ctx: Object) => {
                            const entityClass = plugin.entity(ctx);
                            let settings = await entityClass.load();
                            if (!settings) {
                                settings = new entityClass();
                                await settings.save();
                            }

                            return settings;
                        }
                    },
                    SettingsMutation: {
                        [plugin.namespace]: async (_: any, args: Object, ctx: Object) => {
                            const { data } = args;
                            const entityClass = plugin.entity(ctx);
                            let settings = await entityClass.load();
                            if (!settings) {
                                settings = new entityClass();
                            }

                            if (!settings.data) {
                                settings.data = {};
                            }

                            try {
                                settings.data.populate(data);
                                await settings.save();
                                return settings;
                            } catch (e) {
                                return new ErrorResponse(e);
                            }
                        }
                    }
                };
            })
        ]*/
    }
}: GraphQLSchemaPluginType);
