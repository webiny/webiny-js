// @flow
import { dummyResolver } from "webiny-api/graphql";
import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import apiToken from "./graphql/ApiToken";
import { type PluginType } from "webiny-api/types";
import { hasScope } from "webiny-security/api";

export default ([
    {
        type: "graphql",
        name: "graphql-security",
        namespace: "security",
        scopes: ["superadmin", "users:read", "users:write"],
        typeDefs: () => [
            user.typeDefs,
            user.typeExtensions,
            role.typeDefs,
            role.typeExtensions,
            group.typeDefs,
            group.typeExtensions,
            apiToken.typeDefs,
            /* GraphQL */ `
                type SecurityQuery {
                    scopes: [String]
                }

                type SecurityMutation {
                    _empty: String
                }

                type Query {
                    security: SecurityQuery
                }

                type Mutation {
                    security: SecurityMutation
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
        ],
        shield: {
            SecurityQuery: {
                getApiToken: hasScope("api:read")
            }
        }
    }
]: Array<PluginType>);
