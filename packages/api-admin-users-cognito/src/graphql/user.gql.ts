import md5 from "md5";
import {
    Response,
    NotFoundResponse,
    ErrorResponse,
    ListResponse,
    ListErrorResponse
} from "@webiny/handler-graphql/responses";
import { AdminUser, AdminUsersContext, CreateUserInput, UpdateUserInput } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export default new GraphQLSchemaPlugin<AdminUsersContext & SecurityContext & TenancyContext>({
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
            async profile(identity, args, context) {
                const profile = await context.adminUsers.getUser({ where: { id: identity.id } });

                if (profile) {
                    return profile;
                }

                // We must also consider an option where we have multi-tenancy, and current identity is
                // a "parent" tenant user, so naturally, his user profile lives in his original tenant.
                const tenant = context.tenancy.getCurrentTenant();

                return await context.adminUsers.getUser({
                    where: { id: identity.id, tenant: tenant.parent }
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
            group(user, args, context) {
                return context.security.getGroup({ where: { id: user.group } });
            }
        },
        AdminUsersQuery: {
            getUser: async (_, { where }, context) => {
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
            getCurrentUser: async (_, args, context) => {
                const identity = context.security.getIdentity();

                if (!identity) {
                    throw new NotAuthorizedError();
                }

                const user = await context.adminUsers.getUser({ where: { id: identity.id } });
                if (!user) {
                    return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
                }

                return new Response(user);
            },
            listUsers: async (_, args, context) => {
                try {
                    const userList = await context.adminUsers.listUsers();

                    return new ListResponse(userList);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        AdminUsersMutation: {
            updateCurrentUser: async (_, args: { data: UpdateUserInput }, context) => {
                const { security, adminUsers } = context;
                const identity = security.getIdentity();
                if (!identity) {
                    throw new Error("Not authorized!");
                }

                let user = await adminUsers.getUser({ where: { id: identity.id } });
                if (!user) {
                    // TODO: check if current identity belongs to a different tenant.
                    // If so, switch to that other tenant, and update his profile there.
                    return new NotFoundResponse("User not found!");
                }

                try {
                    user = await adminUsers.updateUser(user.id, args.data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            createUser: async (_, { data }: { data: CreateUserInput }, context) => {
                try {
                    const user = await context.adminUsers.createUser(data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateUser: async (
                root,
                { data, id }: { id: string; data: UpdateUserInput },
                { adminUsers }
            ) => {
                try {
                    const user = await adminUsers.updateUser(id, data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteUser: async (root, { id }: { id: string }, context) => {
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
