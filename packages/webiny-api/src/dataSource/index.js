// @flow
import { dummyResolver } from "../graphql";
import setupEntities from "./../entities/setupEntities";
import role from "./typeDefs/Role";
import group from "./typeDefs/Group";
import user from "./typeDefs/User";
import apiToken from "./typeDefs/ApiToken";
import { addPlugin, getPlugins } from "webiny-api/plugins";

import generalSettings from "../plugins/settings/generalSettings";

export default () => {
    // Register plugins
    addPlugin(...generalSettings);

    return {
        namespace: "security",
        typeDefs: () => [
            user.typeDefs,
            user.typeExtensions,
            role.typeDefs,
            role.typeExtensions,
            group.typeDefs,
            group.typeExtensions,
            apiToken.typeDefs,
            ...getPlugins("schema-settings").map(pl => pl.typeDefs),
            `
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
                },
                SettingsQuery: {
                    _empty: () => ""
                }
            },
            apiToken.resolvers,
            group.resolvers,
            role.resolvers,
            user.resolvers,
            ...getPlugins("schema-settings").map(plugin => {
                const kobaja = {
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

                return kobaja;
            })
        ],
        context: (ctx: Object) => {
            return setupEntities(ctx);
        }
    };
};
