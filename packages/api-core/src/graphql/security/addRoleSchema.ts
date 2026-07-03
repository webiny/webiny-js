import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { GetRoleUseCase } from "~/features/security/roles/GetRole/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { UpdateRoleUseCase } from "~/features/security/roles/UpdateRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";

export const addRoleSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
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
    `);

    builder.addResolver<{ where: any }>({
        path: "SecurityQuery.getRole",
        dependencies: [GetRoleUseCase],
        resolver:
            (useCase: GetRoleUseCase.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.where);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver({
        path: "SecurityQuery.listRoles",
        dependencies: [ListRolesUseCase],
        resolver: (useCase: ListRolesUseCase.Interface) => async () => {
            try {
                const result = await useCase.execute();
                if (result.isFail()) {
                    throw result.error;
                }
                return new ListResponse(result.value);
            } catch (e) {
                return new ListErrorResponse(e);
            }
        }
    });

    builder.addResolver<{ data: any }>({
        path: "SecurityMutation.createRole",
        dependencies: [CreateRoleUseCase],
        resolver:
            (useCase: CreateRoleUseCase.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver<{ id: string; data: any }>({
        path: "SecurityMutation.updateRole",
        dependencies: [UpdateRoleUseCase],
        resolver:
            (useCase: UpdateRoleUseCase.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.id, args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver<{ id: string }>({
        path: "SecurityMutation.deleteRole",
        dependencies: [DeleteRoleUseCase],
        resolver:
            (useCase: DeleteRoleUseCase.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });
};
