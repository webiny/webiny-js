// @flow
import { dummyResolver } from "../graphql";
import setupEntities from "./../entities/setupEntities";
import role from "./typeDefs/Role";
import group from "./typeDefs/Group";
import user from "./typeDefs/User";
import apiToken from "./typeDefs/ApiToken";
import { addPlugin, getPlugins } from "webiny-api/plugins";

import generalSettings from "../plugins/settings/generalSettings";

// Register plugins
addPlugin(...generalSettings);

export default () => {
    return {
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
        resolvers: [
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
            ...getPlugins("schema-settings").map(pl => pl.resolvers)
        ],
        context: (ctx: Object) => {
            return setupEntities(ctx);
        }
    };
};
