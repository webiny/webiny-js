import md5 from "md5";
import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { AdminUser, AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface CreateUserGraphQlPluginsParams {
    teams?: boolean;
}

export default (params: CreateUserGraphQlPluginsParams) => {
    return [
        new GraphQLSchemaPlugin<AdminUsersContext>({
            typeDefs: /* GraphQL */ `
                type AdminUserIdentity implements SecurityIdentity {
                    id: ID!
                    type: String!
                    displayName: String!
                    permissions: [JSON!]!
                    profile: AdminUser
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
                        const adminUser = await context.security.withoutAuthorization(async () => {
                            return context.adminUsers.getUser({
                                where: { id: identity.id }
                            });
                        });

                        if (adminUser) {
                            return adminUser;
                        }

                        // We must also consider an option where we have multi-tenancy, and current identity is
                        // a "parent" tenant user, so naturally, his user profile lives in his original tenant.
                        const tenant = context.tenancy.getCurrentTenant();

                        return context.security.withoutAuthorization(async () => {
                            return context.adminUsers.getUser({
                                where: {
                                    id: identity.id,
                                    /**
                                     * TODO @ts-refactor @pavel
                                     * What happens if tenant has no parent?
                                     * Or is the getUser.where.tenant optional parameter? In that case, remove comments and make tenant param optional
                                     */
                                    // @ts-expect-error
                                    tenant: tenant.parent
                                }
                            });
                        });
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
                        try {
                            const user = await context.adminUsers.getUser({ where });
                            if (!user) {
                                return new NotFoundResponse(
                                    `User "${JSON.stringify(where)}" was not found!`
                                );
                            }
                            return new Response(user);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },
                    getCurrentUser: async (_, __, context) => {
                        const identity = context.security.getIdentity();

                        if (!identity) {
                            throw new NotAuthorizedError();
                        }

                        // Current user might not have permissions to execute `getUser` (this method can load any user in the system),
                        // but loading your own user record should be allowed. For that reason, let's temporarily disable authorization.

                        const user = await context.security.withoutAuthorization(async () => {
                            // Get user record using the identity ID.
                            return await context.adminUsers.getUser({ where: { id: identity.id } });
                        });

                        if (!user) {
                            return new NotFoundResponse(
                                `User with ID ${identity.id} was not found!`
                            );
                        }

                        return new Response(user);
                    },
                    listUsers: async (_, __, context) => {
                        try {
                            const userList = await context.adminUsers.listUsers();

                            return new ListResponse(userList);
                        } catch (e) {
                            return new ListErrorResponse(e);
                        }
                    }
                }
            }
        }),
        params.teams &&
            new GraphQLSchemaPlugin<AdminUsersContext>({
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
