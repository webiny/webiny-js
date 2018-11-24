// @flow
import { dummyResolver } from "../graphql";
import setupEntities from "./../entities/setupEntities";
import role from "./typeDefs/Role";
import group from "./typeDefs/Group";
import user from "./typeDefs/User";
import apiToken from "./typeDefs/ApiToken";
// import systemSettings from "./typeDefs/SystemSettings";

export default {
    namespace: "security",
    scopes: ["superadmin", "users:read", "users:write"],
    typeDefs: [
        user.typeDefs,
        user.typeExtensions,
        role.typeDefs,
        role.typeExtensions,
        group.typeDefs,
        group.typeExtensions,
        apiToken.typeDefs,
        /*systemSettings.typeDefs,*/
        `
        type SecurityQuery {
            scopes: [String]
        }
        
        type SecurityMutation {
            _empty: String
        }
        
      
        
        type Query {
            security: SecurityQuery
            systemSettings: SystemSettingsQuery
        }
        
        type Mutation {
            security: SecurityMutation
            systemSettings: SystemSettingsMutation
        }
    `
    ],
    resolvers: [
        {
            Query: {
                security: dummyResolver,
                systemSettings: dummyResolver
            },
            Mutation: {
                security: dummyResolver,
                systemSettings: dummyResolver
            }
        },
        apiToken.resolvers,
        group.resolvers,
        role.resolvers,
        user.resolvers
        /*systemSettings.resolvers*/
    ],
    context: (ctx: Object) => {
        return setupEntities(ctx);
    }
};
