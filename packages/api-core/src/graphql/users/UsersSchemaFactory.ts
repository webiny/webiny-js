import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { AdminUser } from "~/types/users.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import NotAuthorizedResponse from "~/graphql/security/NotAuthorizedResponse.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";

class UsersSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type AdminUsersQuery {
                _empty: String
            }

            type AdminUsersMutation {
                _empty: String
            }

            extend type Query {
                adminUsers: AdminUsersQuery
            }

            extend type Mutation {
                adminUsers: AdminUsersMutation
            }

            type AdminUsersCreatedBy {
                id: ID
                displayName: String
            }

            type AdminUsersError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type AdminUsersBooleanResponse {
                data: Boolean
                error: AdminUsersError
            }

            type AdminUser {
                id: ID!
                displayName: String!
                email: String!

                roles: [SecurityRole]
                firstName: String
                lastName: String
                avatar: JSON
                external: Boolean
                createdOn: DateTime
            }

            type AdminUsersResponse {
                data: AdminUser
                error: AdminUsersError
            }

            type AdminUsersListResponse {
                data: [AdminUser]
                error: AdminUsersError
            }

            input AdminUsersGetUserWhereInput {
                id: ID
                email: String
            }

            extend type AdminUsersQuery {
                getUser(where: AdminUsersGetUserWhereInput): AdminUsersResponse
                getCurrentUser: AdminUsersResponse
                listUsers: AdminUsersListResponse
            }

            extend type AdminUser {
                teams: [SecurityTeam]
            }
        `);

        builder.addResolver({
            path: "Query.adminUsers",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "Mutation.adminUsers",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "AdminUser.roles",
            dependencies: [ListRolesUseCase],
            resolver:
                (listRoles: ListRolesUseCase.Interface) =>
                async ({ parent }: { parent: AdminUser }) => {
                    if (!parent.roles) {
                        return null;
                    }

                    const result = await listRoles.execute({ where: { id_in: parent.roles } });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                }
        });

        builder.addResolver({
            path: "AdminUser.teams",
            dependencies: [ListTeamsUseCase],
            resolver:
                (listTeams: ListTeamsUseCase.Interface) =>
                async ({ parent }: { parent: AdminUser }) => {
                    const hasTeams = Array.isArray(parent.teams) && parent.teams.length > 0;
                    if (!hasTeams) {
                        return [];
                    }

                    const result = await listTeams.execute({ where: { id_in: parent.teams } });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                }
        });

        builder.addResolver<{ where: any }>({
            path: "AdminUsersQuery.getUser",
            dependencies: [GetUserUseCase],
            resolver:
                (getUser: GetUserUseCase.Interface) =>
                async ({ args }) => {
                    const { where } = args;
                    const userResult = await getUser.execute({
                        id: where.id,
                        email: where.email
                    });

                    if (userResult.isFail()) {
                        const error = userResult.error;
                        if (error.code === "AdminUser/NotFound") {
                            return new NotFoundResponse(
                                `User "${JSON.stringify(where)}" was not found!`
                            );
                        }

                        return new ErrorResponse({
                            message: error.message,
                            code: error.code,
                            data: error.data
                        });
                    }

                    return new Response(userResult.value);
                }
        });

        builder.addResolver({
            path: "AdminUsersQuery.getCurrentUser",
            dependencies: [IdentityContext, GetUserUseCase],
            resolver:
                (identityContext: IdentityContext.Interface, getUser: GetUserUseCase.Interface) =>
                async () => {
                    const identity = identityContext.getIdentity();

                    if (!identity.isAdmin()) {
                        throw new NotAuthorizedResponse();
                    }

                    // Current user might not have permissions to execute `getUser` (this method can load any user in the system),
                    // but loading your own user record should be allowed. For that reason, let's temporarily disable authorization.
                    const userResponse = await identityContext.withoutAuthorization(async () => {
                        // Get user record using the identity ID.
                        return await getUser.execute({ id: identity.id });
                    });

                    if (userResponse.isFail()) {
                        const error = userResponse.error;
                        if (error.code === "AdminUser/NotFound") {
                            return new NotFoundResponse(
                                `User with ID ${identity.id} was not found!`
                            );
                        }

                        return new ErrorResponse({
                            message: error.message,
                            code: error.code,
                            data: error.data
                        });
                    }

                    return new Response(userResponse.value);
                }
        });

        builder.addResolver({
            path: "AdminUsersQuery.listUsers",
            dependencies: [ListUsersUseCase],
            resolver: (listUsers: ListUsersUseCase.Interface) => async () => {
                const users = await listUsers.execute();

                if (users.isFail()) {
                    return new ListErrorResponse(users.error);
                }

                return new ListResponse(users.value);
            }
        });

        return builder;
    }
}

export const UsersSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: UsersSchemaFactoryImpl,
    dependencies: []
});
