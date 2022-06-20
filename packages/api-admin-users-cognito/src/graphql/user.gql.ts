/**
 * Package md5 does not have types.
 */
// @ts-ignore
import md5 from "md5";
import {
    Response,
    NotFoundResponse,
    ErrorResponse,
    ListResponse,
    ListErrorResponse
} from "@webiny/handler-graphql/responses";
import { AdminUser, AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";

export default new GraphQLSchemaPlugin<AdminUsersContext>({
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
            firstName: String
            lastName: String
            email: String
            avatar: JSON
            gravatar: String
            group: SecurityGroup
            createdOn: DateTime
        }

        """
        This input type is used by administrators to create other user's accounts within the same tenant.
        """
        input AdminUsersCreateInput {
            email: String!
            firstName: String!
            lastName: String!
            password: String!
            avatar: JSON
            group: String!
        }

        """
        This input type is used by administrators to update other user's accounts within the same tenant.
        """
        input AdminUsersUpdateInput {
            email: String
            firstName: String
            lastName: String
            password: String
            avatar: JSON
            group: String
        }

        """
        This input type is used by the user who is updating his own account
        """
        input AdminUsersCurrentUserInput {
            email: String
            firstName: String
            lastName: String
            password: String
            avatar: JSON
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

        extend type AdminUsersMutation {
            updateCurrentUser(data: AdminUsersCurrentUserInput!): AdminUsersResponse

            createUser(data: AdminUsersCreateInput!): AdminUsersResponse

            updateUser(id: ID!, data: AdminUsersUpdateInput!): AdminUsersResponse

            deleteUser(id: ID!): AdminUsersBooleanResponse
        }
    `,
    resolvers: {
        AdminUserIdentity: {
            async profile(identity, _, context) {
                const profile = await context.adminUsers.getUser({
                    where: {
                        id: identity.id
                    }
                });

                if (profile) {
                    return profile;
                }

                // We must also consider an option where we have multi-tenancy, and current identity is
                // a "parent" tenant user, so naturally, his user profile lives in his original tenant.
                const tenant = context.tenancy.getCurrentTenant();

                return await context.adminUsers.getUser({
                    where: {
                        id: identity.id,
                        /**
                         * TODO @ts-refactor @pavel
                         * What happens if tenant has no parent?
                         * Or is the getUser.where.tenant optional parameter? In that case, remove comments and make tenant param optional
                         */
                        // @ts-ignore
                        tenant: tenant.parent
                    }
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
            group(user, _, context) {
                return context.security.getGroup({ where: { id: user.group } });
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
                context.security.disableAuthorization();

                // Get user record using the identity ID.
                const user = await context.adminUsers.getUser({ where: { id: identity.id } });

                // Now we can re-enable authorization.
                context.security.enableAuthorization();

                if (!user) {
                    return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
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
        },
        AdminUsersMutation: {
            updateCurrentUser: async (_, args: any, context) => {
                const { security, adminUsers } = context;
                const identity = security.getIdentity();
                if (!identity) {
                    throw new Error("Not authorized!");
                }

                // Current user might not have permissions for `adminUsers`.
                context.security.disableAuthorization();

                let user = await adminUsers.getUser({ where: { id: identity.id } });
                if (!user) {
                    // TODO: check if current identity belongs to a different tenant.
                    // TODO: If so, switch to that other tenant, and update his profile there.
                    return new NotFoundResponse("User not found!");
                }

                try {
                    user = await adminUsers.updateUser(user.id, args.data);

                    // Now we can re-enable authorization.
                    context.security.enableAuthorization();

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            createUser: async (_, { data }: any, context) => {
                try {
                    const user = await context.adminUsers.createUser(data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateUser: async (_, { data, id }: any, { adminUsers }) => {
                try {
                    const user = await adminUsers.updateUser(id, data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteUser: async (_, { id }: any, context) => {
                try {
                    await context.adminUsers.deleteUser(id);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
