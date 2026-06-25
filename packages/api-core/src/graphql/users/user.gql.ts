import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { ApiCoreContext } from "~/types/core.js";
import { AdminUser } from "~/types/users.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import NotAuthorizedResponse from "~/graphql/security/NotAuthorizedResponse.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";

const emptyResolver = () => ({});

export const createUsersGraphQL = (): GraphQLSchemaDefinition<ApiCoreContext>[] => {
    return [
        {
            typeDefs: /* GraphQL */ `
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
            `,
            resolvers: {
                Query: {
                    adminUsers: emptyResolver
                },
                Mutation: {
                    adminUsers: emptyResolver
                }
            }
        },
        {
            typeDefs: /* GraphQL */ `
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
            `,
            resolvers: {
                AdminUser: {
                    async roles(user: AdminUser, _, context) {
                        if (!user.roles) {
                            return null;
                        }

                        const listRoles = context.container.resolve(ListRolesUseCase);
                        const result = await listRoles.execute({ where: { id_in: user.roles } });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    }
                },
                AdminUsersQuery: {
                    getUser: async (_, { where }: any, context) => {
                        const getUser = context.container.resolve(GetUserUseCase);

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
                    },
                    getCurrentUser: async (_, __, context) => {
                        const identityContext = context.container.resolve(IdentityContext);
                        const identity = identityContext.getIdentity();

                        if (!identity.isAdmin()) {
                            throw new NotAuthorizedResponse();
                        }

                        // Current user might not have permissions to execute `getUser` (this method can load any user in the system),
                        // but loading your own user record should be allowed. For that reason, let's temporarily disable authorization.

                        const getUser = context.container.resolve(GetUserUseCase);

                        const userResponse = await identityContext.withoutAuthorization(
                            async () => {
                                // Get user record using the identity ID.
                                return await getUser.execute({ id: identity.id });
                            }
                        );

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
                    },
                    listUsers: async (_, __, context) => {
                        const listUsers = context.container.resolve(ListUsersUseCase);
                        const users = await listUsers.execute();

                        if (users.isFail()) {
                            return new ListErrorResponse(users.error);
                        }

                        return new ListResponse(users.value);
                    }
                }
            }
        },
        {
            typeDefs: /* GraphQL */ `
                extend type AdminUser {
                    teams: [SecurityTeam]
                }
            `,
            resolvers: {
                AdminUser: {
                    async teams(user: AdminUser, _, context) {
                        const hasTeams = Array.isArray(user.teams) && user.teams.length > 0;
                        if (!hasTeams) {
                            return [];
                        }

                        const listTeams = context.container.resolve(ListTeamsUseCase);
                        const result = await listTeams.execute({ where: { id_in: user.teams } });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    }
                }
            }
        }
    ];
};
