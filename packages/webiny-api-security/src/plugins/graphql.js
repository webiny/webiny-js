// @flow
import { dummyResolver } from "webiny-api/graphql";
import role from "./graphql/Role";
import group from "./graphql/Group";
import user from "./graphql/User";
import { type PluginType } from "webiny-api/types";
import { getRegisteredScopes, hasScope } from "webiny-api-security";

export default ([
    {
        type: "graphql",
        name: "graphql-security-schema",
        namespace: "security",
        typeDefs: () => [
            user.typeDefs,
            user.typeExtensions,
            role.typeDefs,
            role.typeExtensions,
            group.typeDefs,
            group.typeExtensions,
            /* GraphQL */ `
                type SecurityQuery {
                    # Returns all scopes that were registered throughout the schema.
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
            group.resolvers,
            role.resolvers,
            user.resolvers
        ],
        security: {
            shield: {
                SecurityQuery: {
                    getGroup: hasScope("security:group:crud"),
                    listGroups: hasScope("security:group:crud"),
                    getRole: hasScope("security:role:crud"),
                    listRoles: hasScope("security:role:crud"),
                    getUser: hasScope("security:user:crud"),
                    listUsers: hasScope("security:user:crud")
                },
                SecurityMutation: {
                    createGroup: hasScope("security:group:crud"),
                    updateGroup: hasScope("security:group:crud"),
                    deleteGroup: hasScope("security:group:crud"),
                    createRole: hasScope("security:role:crud"),
                    updateRole: hasScope("security:role:crud"),
                    deleteRole: hasScope("security:role:crud"),
                    createUser: hasScope("security:user:crud"),
                    updateUser: hasScope("security:user:crud"),
                    deleteUser: hasScope("security:user:crud")
                }
            }
        }
    }
]: Array<PluginType>);
