import md5 from "md5";
import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { SecurityIdentity } from "~/types/security.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import type { ApiCoreContext } from "~/types/core.js";
import { AdminUser } from "~/types/users.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import NotAuthorizedResponse from "~/graphql/security/NotAuthorizedResponse.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";

const emptyResolver = () => ({});

export interface CreateUserGraphQlPluginsParams {
    teams?: boolean;
}

export const createUsersGraphQL = (params: CreateUserGraphQlPluginsParams) => {
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
                type AdminUserIdentity implements SecurityIdentity {
                    id: ID!
                    type: String!
                    displayName: String!
                    permissions: [JSON!]!
                    profile: AdminUser
                    currentTenant: Tenant
                    defaultTenant: Tenant
                }

                type AdminUser {
                    id: ID!
                    displayName: String!
                    email: String!

                    groups: [SecurityGroup]
                    firstName: String
                    lastName: String
                    avatar: JSON
                    gravatar: String
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
                AdminUserIdentity: {
                    async profile(identity, _, context) {
                        // TODO: refactor this resolver into a proper class with dependencies.
                        const tenantContext = context.container.resolve(TenantContext);
                        const getTenantUseCase = context.container.resolve(GetTenantByIdUseCase);
                        const getUserUseCase = context.container.resolve(GetUserUseCase);

                        const adminUser = await context.security.withoutAuthorization(async () => {
                            return getUserUseCase.execute({ id: identity.id });
                        });

                        if (adminUser.isOk()) {
                            return adminUser.value;
                        }

                        // TODO: `parent` tenant resolution should be a decorator of the base resolver.
                        // We must also consider an option where we have multi-tenancy, and current identity is
                        // a "parent" tenant user, so naturally, his user profile lives in his original tenant.
                        const tenant = context.tenancy.getCurrentTenant();

                        const parentTenantUser = await context.security.withoutAuthorization(
                            async () => {
                                if (!tenant.parent) {
                                    return null;
                                }

                                const parentTenantResult = await getTenantUseCase.execute(
                                    tenant.parent
                                );

                                return tenantContext.withTenant(parentTenantResult.value, () => {
                                    return getUserUseCase.execute({ id: identity.id });
                                });
                            }
                        );

                        if (parentTenantUser) {
                            return parentTenantUser.value;
                        }

                        return {};
                    },
                    __isTypeOf(obj: SecurityIdentity) {
                        return obj.type === "admin";
                    }
                },
                AdminUser: {
                    gravatar(user: AdminUser) {
                        return "https://www.gravatar.com/avatar/" + md5(user.email);
                    },
                    groups(user: AdminUser, _, context) {
                        if (!user.groups) {
                            return null;
                        }

                        return context.security.listGroups({ where: { id_in: user.groups } });
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
                            if (error.code === "USER_NOT_FOUND") {
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
                        const identity = context.security.getIdentity();

                        if (identity.isAnonymous()) {
                            throw new NotAuthorizedResponse();
                        }

                        // Current user might not have permissions to execute `getUser` (this method can load any user in the system),
                        // but loading your own user record should be allowed. For that reason, let's temporarily disable authorization.

                        const getUser = context.container.resolve(GetUserUseCase);

                        const userResponse = await context.security.withoutAuthorization(
                            async () => {
                                // Get user record using the identity ID.
                                return await getUser.execute({ id: identity.id });
                            }
                        );

                        if (userResponse.isFail()) {
                            const error = userResponse.error;
                            if (error.code === "USER_NOT_FOUND") {
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
        }),
        params.teams &&
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
