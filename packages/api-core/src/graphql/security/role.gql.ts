import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { ApiCoreContext } from "~/types/core.js";

export default new GraphQLSchemaPlugin<ApiCoreContext>({
    typeDefs: /* GraphQL */ `
        type SecurityRole {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            permissions: [JSON]
            system: Boolean!
            plugin: Boolean
        }

        input SecurityRoleCreateInput {
            name: String!
            slug: String!
            description: String
            permissions: [JSON!]!
        }

        input SecurityRoleUpdateInput {
            name: String
            description: String
            permissions: [JSON!]
        }

        type SecurityRoleResponse {
            data: SecurityRole
            error: SecurityError
        }

        type SecurityRoleListResponse {
            data: [SecurityRole]
            error: SecurityError
        }

        input GetRoleWhereInput {
            id: ID
            slug: String
        }

        extend type SecurityQuery {
            getRole(where: GetRoleWhereInput!): SecurityRoleResponse
            listRoles: SecurityRoleListResponse
        }

        extend type SecurityMutation {
            createRole(data: SecurityRoleCreateInput!): SecurityRoleResponse
            updateRole(id: ID!, data: SecurityRoleUpdateInput!): SecurityRoleResponse
            deleteRole(id: ID!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getRole: async (_, { where }, context) => {
                try {
                    const roles = await context.security.getRole({ where });
                    return new Response(roles);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listRoles: async (_, __, context) => {
                try {
                    const rolesList = await context.security.listRoles();

                    return new ListResponse(rolesList);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            createRole: async (_, { data }, context) => {
                try {
                    const role = await context.security.createRole(data);

                    return new Response(role);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateRole: async (_, { id, data }, context) => {
                try {
                    const role = await context.security.updateRole(id, data);
                    return new Response(role);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteRole: async (_, { id }, context) => {
                try {
                    await context.security.deleteRole(id);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
