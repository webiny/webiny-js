// @flow
import { dummyResolver } from "webiny-api/graphql";
import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import apiToken from "./graphql/ApiToken";
import { getPlugins } from "webiny-plugins";
import { type GraphQLSchemaPluginType } from "webiny-api/types";

export default ({
    type: "graphql",
    name: "graphql-api",
    namespace: "api",
    scopes: ["superadmin", "users:read", "users:write"],
    typeDefs: () => [
        user.typeDefs,
        user.typeExtensions,
        role.typeDefs,
        role.typeExtensions,
        group.typeDefs,
        group.typeExtensions,
        apiToken.typeDefs,
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
                security: SecurityQuery
                settings: SettingsQuery
            }

            type Mutation {
                security: SecurityMutation
                settings: SettingsMutation
            }
        `
    ],
    resolvers: () => [
        {
            Query: {
                security: dummyResolver,
                settings: dummyResolver
            },
            Mutation: {
                security: dummyResolver,
                settings: dummyResolver
            }
        },
        apiToken.resolvers,
        group.resolvers,
        role.resolvers,
        user.resolvers,
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
