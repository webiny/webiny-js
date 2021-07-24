import md5 from "md5";
import {
    Response,
    NotFoundResponse,
    ErrorResponse,
    ListResponse,
    ListErrorResponse
} from "@webiny/handler-graphql/responses";
import { AdminUsersContext, CreateUserInput, UpdateUserInput, User } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { NotAuthorizedError } from "@webiny/api-security";

const gravatar = (user: User) => {
    return "https://www.gravatar.com/avatar/" + md5(user.login);
};

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        type TenantAccess {
            """
            Tenant ID
            """
            id: ID

            """
            Tenant name
            """
            name: String

            """
            Tenant permissions
            """
            permissions: [JSON]
        }

        type SecurityIdentity {
            login: String
            access: [TenantAccess]
            firstName: String
            lastName: String
            avatar: JSON
            gravatar: String
        }

        type SecurityUserGroup {
            name: String
            slug: String
        }

        type SecurityUser {
            login: String
            firstName: String
            lastName: String
            avatar: JSON
            gravatar: String
            createdOn: DateTime
            """
            The group this user belongs to within current tenant.
            """
            group: SecurityUserGroup
        }

        """
        This input type is used by administrators to create other user's accounts within the same tenant.
        """
        input SecurityUserCreateInput {
            login: String!
            firstName: String!
            lastName: String!
            avatar: JSON
            group: String!
        }

        """
        This input type is used by administrators to update other user's accounts within the same tenant.
        """
        input SecurityUserUpdateInput {
            firstName: String
            lastName: String
            avatar: JSON
            group: String
        }

        """
        This input type is used by the user who is updating his own account
        """
        input SecurityCurrentUserInput {
            firstName: String
            lastName: String
            avatar: JSON
        }

        type SecurityUserResponse {
            data: SecurityUser
            error: SecurityError
        }

        type SecurityUserListResponse {
            data: [SecurityUser]
            error: SecurityError
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityQuery {
            "Get a single user by id or specific search criteria"
            getUser(login: String): SecurityUserResponse

            "Get current user"
            getCurrentUser: SecurityUserResponse

            "Get a list of users"
            listUsers: SecurityUserListResponse
        }

        extend type SecurityMutation {
            "Login using idToken obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse

            "Update current user"
            updateCurrentUser(data: SecurityCurrentUserInput!): SecurityUserResponse

            createUser(data: SecurityUserCreateInput!): SecurityUserResponse

            updateUser(login: String!, data: SecurityUserUpdateInput!): SecurityUserResponse

            deleteUser(login: String!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityUser: {
            gravatar,
            async avatar(user: User) {
                return user.avatar;
            },
            async group(user: User, args, { security, tenancy }) {
                const tenant = tenancy.getCurrentTenant();
                const allPermissions = await security.users.getUserAccess(user.login);
                const tenantAccess = allPermissions.find(p => p.tenant.id === tenant.id);
                if (tenantAccess) {
                    return { slug: tenantAccess.group.slug, name: tenantAccess.group.name };
                }

                return null;
            }
        },
        SecurityIdentity: {
            gravatar,
            login: (_, args, context) => {
                return context.security.getIdentity().id;
            },
            async avatar(user: User) {
                return user.avatar;
            },
            async access(user: User, args, context) {
                const access = await context.security.users.getUserAccess(user.login);
                return access.map(item => ({
                    id: item.tenant.id,
                    name: item.tenant.name,
                    permissions: item.group.permissions
                }));
            }
        },
        SecurityQuery: {
            getUser: async (_, args: { login: string }, context) => {
                const { login } = args;

                try {
                    const user = await context.security.users.getUser(login);
                    if (!user) {
                        return new NotFoundResponse(`User "${login}" was not found!`);
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

                const user = await context.security.users.getUser(identity.id, { auth: false });
                if (!user) {
                    return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
                }

                return new Response(user);
            },
            listUsers: async (_, args, context) => {
                try {
                    const userList = await context.security.users.listUsers();

                    return new ListResponse(userList);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            login: async (root, args, context) => {
                try {
                    const user = await context.security.users.login();

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateCurrentUser: async (_, args: { data: UpdateUserInput }, context) => {
                const { security } = context;
                const identity = security.getIdentity();
                if (!identity) {
                    throw new Error("Not authorized!");
                }

                let user = await security.users.getUser(identity.id);
                if (!user) {
                    return new NotFoundResponse("User not found!");
                }

                try {
                    user = await security.users.updateUser(user.login, args.data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            createUser: async (_, { data }: { data: CreateUserInput }, context) => {
                try {
                    const user = await context.security.users.createUser(data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateUser: async (
                root,
                { data, login }: { login: string; data: UpdateUserInput },
                { security }
            ) => {
                try {
                    const user = await security.users.updateUser(login, data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteUser: async (root, { login }: { login: string }, context) => {
                try {
                    await context.security.users.deleteUser(login);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
