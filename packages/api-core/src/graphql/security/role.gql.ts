import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { ApiCoreContext } from "~/types/core.js";
import { GetRoleUseCase } from "~/features/security/roles/GetRole/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { UpdateRoleUseCase } from "~/features/security/roles/UpdateRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";

const schema: GraphQLSchemaDefinition<ApiCoreContext> = {
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
                    const useCase = context.container.resolve(GetRoleUseCase);
                    const result = await useCase.execute(where);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listRoles: async (_, __, context) => {
                try {
                    const useCase = context.container.resolve(ListRolesUseCase);
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new ListResponse(result.value);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            createRole: async (_, { data }, context) => {
                try {
                    const useCase = context.container.resolve(CreateRoleUseCase);
                    const result = await useCase.execute(data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateRole: async (_, { id, data }, context) => {
                try {
                    const useCase = context.container.resolve(UpdateRoleUseCase);
                    const result = await useCase.execute(id, data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteRole: async (_, { id }, context) => {
                try {
                    const useCase = context.container.resolve(DeleteRoleUseCase);
                    const result = await useCase.execute(id);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
};

export default schema;
