// @flow
import { dummyResolver } from "../graphql";
import role from "./typeDefs/Role";
import group from "./typeDefs/Group";
import user from "./typeDefs/User";
import apiToken from "./typeDefs/ApiToken";
import { addPlugin } from "webiny-api/plugins";
import entities from "webiny-api/plugins/entities";
import graphqlContextEntities from "webiny-api/plugins/graphqlContextEntities";

export default () => {
    // Register plugins
    addPlugin(...entities, graphqlContextEntities);

    return {
        namespace: "api",
        scopes: ["superadmin", "users:read", "users:write"],
        typeDefs: [
            user.typeDefs,
            user.typeExtensions,
            role.typeDefs,
            role.typeExtensions,
            group.typeDefs,
            group.typeExtensions,
            apiToken.typeDefs,
            `
        type Query {
            security: SecurityQuery
        }
        
        type Mutation {
            security: SecurityMutation
        }
        
        type SecurityQuery {
            scopes: [String]
        }
        
        type SecurityMutation {
            _empty: String
        }
    `
        ],
        resolvers: [
            {
                Query: {
                    security: dummyResolver
                },
                Mutation: {
                    security: dummyResolver
                }
            },
            apiToken.resolvers,
            group.resolvers,
            role.resolvers,
            user.resolvers
        ]
    };
};
