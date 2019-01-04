// @flow
import { dummyResolver } from "webiny-api/graphql";
import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import apiToken from "./graphql/ApiToken";
import { type PluginType } from "webiny-api/types";
import { getRegisteredScopes, hasScope } from "webiny-api-security";

export default ([
    {
        type: "graphql",
        name: "graphql-security",
        namespace: "security",
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
                    # Returns all scopes that were used throughout the schema.
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
                },
                SecurityQuery: {
                    scopes: getRegisteredScopes
                }
            },
            apiToken.resolvers,
            group.resolvers,
            role.resolvers,
            user.resolvers
        ],
        security: {
            shield: {
                SecurityQuery: {
                    getApiToken: hasScope("security:api_token:get"),
                    listApiTokens: hasScope("security:api_token:list"),
                    getGroup: hasScope("security:group:get"),
                    listGroups: hasScope("security:group:list"),
                    getRole: hasScope("security:role:get"),
                    listRoles: hasScope("security:role:list"),
                    getUser: hasScope("security:user:get"),
                    listUsers: hasScope("security:user:list")
                },
                SecurityMutation: {
                    createApiToken: hasScope("security:api_token:create"),
                    updateApiToken: hasScope("security:api_token:update"),
                    deleteApiToken: hasScope("security:api_token:delete"),
                    createGroup: hasScope("security:group:create"),
                    updateGroup: hasScope("security:group:update"),
                    deleteGroup: hasScope("security:group:delete"),
                    createRole: hasScope("security:role:create"),
                    updateRole: hasScope("security:role:update"),
                    deleteRole: hasScope("security:role:delete"),
                    createUser: hasScope("security:user:create"),
                    updateUser: hasScope("security:user:update"),
                    deleteUser: hasScope("security:user:delete")
                }
            }
        }
    }
]: Array<PluginType>);
