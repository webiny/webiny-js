// @flow
import { dummyResolver } from "../graphql";
import { getPlugins } from "webiny-plugins";
import { type GraphQLSchemaPluginType } from "webiny-api/types";
import { ErrorResponse } from "webiny-api/graphql";

export default ({
    type: "graphql-schema",
    name: "graphql-schema-api",
    schema: {
        namespace: "api",
        typeDefs: () => {
            return [
                /* GraphQL */ `
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
                ...getPlugins("schema-settings").map(pl => pl.typeDefs)
            ];
        },
        resolvers: () => [
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
        ]
    }
}: GraphQLSchemaPluginType);
