import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { ApiCoreContext } from "~/types/core.js";
import { AdminUser } from "~/types/users.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { GetCurrentUserUseCase } from "~/features/users/GetCurrentUser/index.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";

const emptyResolver = () => ({});

export const createUsersGraphQL = () => {
    return [
        new GraphQLSchemaPlugin<ApiCoreContext>({
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
        }),
        new GraphQLSchemaPlugin<ApiCoreContext>({
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
                    roles(user: AdminUser, _, context) {
                        if (!user.roles) {
                            return null;
                        }

                        return context.security.listRoles({ where: { id_in: user.roles } });
                    }
                },
                AdminUsersQuery: {
                    getUser: async (_, args: any, context) => {
                        // `where` is optional in the schema.
                        const where = args.where ?? {};
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
                        const getCurrentUser = context.container.resolve(GetCurrentUserUseCase);

                        const userResult = await getCurrentUser.execute();

                        if (userResult.isFail()) {
                            const error = userResult.error;
                            if (error.code === "AdminUser/NotFound") {
                                return new NotFoundResponse("Current user was not found!");
                            }

                            return new ErrorResponse({
                                message: error.message,
                                code: error.code,
                                data: error.data
                            });
                        }

                        return new Response(userResult.value);
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
        }),
        new GraphQLSchemaPlugin<ApiCoreContext>({
            typeDefs: /* GraphQL */ `
                extend type AdminUser {
                    teams: [SecurityTeam]
                }
            `,
            resolvers: {
                AdminUser: {
                    teams(user: AdminUser, _, context) {
                        const hasTeams = Array.isArray(user.teams) && user.teams.length > 0;
                        if (!hasTeams) {
                            return [];
                        }

                        return context.security.listTeams({ where: { id_in: user.teams } });
                    }
                }
            }
        })
    ].filter(Boolean);
};
