// @flow
import { dummyResolver } from "../graphql";
import { getPlugins } from "webiny-plugins";
import { type GraphQLSchemaPluginType } from "webiny-api/types";

export default ({
    type: "graphql",
    name: "graphql-api",
    namespace: "api",
    typeDefs: () => [
        ...getPlugins("schema-settings").map(pl => pl.typeDefs),
        /* GraphQL */ `
            type SecurityQuery {
                scopes: [String]
            }

            type SecurityMutation {
                _empty: String
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
        `
    ],
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

                        return settings.data;
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
                        settings.data = data;
                        await settings.save();

                        return settings.data;
                    }
                }
            };
        })
    ]
}: GraphQLSchemaPluginType);
