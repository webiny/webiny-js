// @flow
import { dummyResolver } from "../graphql";
import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import apiToken from "./graphql/ApiToken";
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
    resolvers: () => [
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
}: GraphQLSchemaPluginType);
