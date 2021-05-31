import md5 from "md5";
import { SecurityContext } from "@webiny/api-security/types";
import {
    Response,
    NotFoundResponse,
    ErrorResponse,
    ListResponse,
    ListErrorResponse
} from "@webiny/handler-graphql/responses";
import { Context as HandlerContext } from "@webiny/handler/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    CreateUserInput,
    TenancyContext,
    SecurityIdentityProviderPlugin,
    UpdateUserInput,
    User
} from "../types";
import NotAuthorizedResponse from "@webiny/api-security/NotAuthorizedResponse";

const gravatar = (user: User) => {
    return "https://www.gravatar.com/avatar/" + md5(user.login);
};

const plugin: GraphQLSchemaPlugin<HandlerContext<TenancyContext, SecurityContext>> = {
    type: "graphql-schema",
    name: "graphql-schema-security-user",
    schema: {
        typeDefs: `
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
                async group(user: User, args, { security }) {
                    const tenant = security.getTenant();
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
                    const { security } = context;
                    const permission = await security.getPermission("security.user");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    const { login } = args;

                    try {
                        const user = await security.users.getUser(login);
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
                        throw new Error("Not authorized!");
                    }

                    const user = await context.security.users.getUser(identity.id);
                    if (!user) {
                        return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
                    }

                    return new Response(user);
                },
                listUsers: async (_, args, context) => {
                    const { security } = context;
                    const permission = await security.getPermission("security.user");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const tenant = security.getTenant();
                        const userList = await security.users.listUsers({
                            tenant: tenant.id
                        });

                        return new ListResponse(userList);
                    } catch (e) {
                        return new ListErrorResponse(e);
                    }
                }
            },
            SecurityMutation: {
                login: async (root, args, context) => {
                    const { security, plugins } = context;
                    try {
                        const identity = security.getIdentity();

                        if (!identity) {
                            throw new Error("Not authorized!");
                        }

                        let user = await security.users.getUser(identity.id);

                        let firstLogin = false;

                        if (!user) {
                            firstLogin = true;
                            // Create a "Security User"
                            user = await security.users.createUser({
                                login: identity.id,
                                firstName: identity.firstName || "",
                                lastName: identity.lastName || "",
                                avatar: identity.avatar
                            });
                        }

                        const authPlugin = plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        if (typeof authPlugin.onLogin === "function") {
                            await authPlugin.onLogin({ user, firstLogin }, context);
                        }

                        return new Response(user);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                updateCurrentUser: async (_, args: { data: UpdateUserInput }, context) => {
                    const { security, plugins } = context;
                    const identity = security.getIdentity();
                    if (!identity) {
                        throw new Error("Not authorized!");
                    }

                    const user = await security.users.getUser(identity.id);
                    if (!user) {
                        return new NotFoundResponse("User not found!");
                    }

                    try {
                        // We need to explicitly pick attributes we want to handle, as plugins can add their own
                        // fields to GraphQL Schema, and we don't want to have those in the mix.
                        const { firstName, lastName, avatar } = args.data;

                        const updatedAttributes = await security.users.updateUser(user.login, {
                            firstName,
                            lastName,
                            avatar
                        });

                        // Assign updated attributes to the original user data object
                        Object.assign(user, updatedAttributes);

                        const authPlugin = plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        if (authPlugin) {
                            await authPlugin.updateUser({ data: args.data, user }, context);
                        }

                        return new Response(user);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                createUser: async (_, { data }: { data: CreateUserInput }, context) => {
                    const { security, plugins } = context;
                    const permission = await security.getPermission("security.user");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const authPlugin = plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        // First let's try creating a user with our IDP
                        await authPlugin.createUser({ data }, context);

                        // Now we can store the user in our DB
                        const user = await security.users.createUser(data);

                        const tenant = security.getTenant();
                        const group = await security.groups.getGroup(tenant, data.group);
                        await security.users.linkUserToTenant(user.login, tenant, group);

                        return new Response(user);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                updateUser: async (
                    root,
                    { data, login }: { login: string; data: UpdateUserInput },
                    context
                ) => {
                    const { security, plugins } = context;
                    const permission = await security.getPermission("security.user");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const user = await security.users.getUser(login);

                        if (!user) {
                            return new NotFoundResponse(`User "${login}" was not found!`);
                        }

                        const updatedAttributes = await security.users.updateUser(login, data);

                        // Link user with a new group
                        if (updatedAttributes.group) {
                            const tenant = security.getTenant();

                            await security.users.unlinkUserFromTenant(user.login, tenant);

                            const group = await security.groups.getGroup(
                                tenant,
                                updatedAttributes.group
                            );

                            await security.users.linkUserToTenant(user.login, tenant, group);
                        }

                        Object.assign(user, updatedAttributes);

                        const authPlugin = plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        if (authPlugin) {
                            await authPlugin.updateUser({ data, user }, context);
                        }

                        return new Response(user);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                deleteUser: async (root, { login }: { login: string }, context) => {
                    const { plugins, security } = context;
                    const permission = await security.getPermission("security.user");

                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }

                    try {
                        const user = await security.users.getUser(login);
                        const identity = security.getIdentity();

                        if (!user) {
                            return new NotFoundResponse(`User "${login}" was not found!`);
                        }

                        if (user.login === identity.id) {
                            return new ErrorResponse({
                                message: `You can't delete your own user account.`
                            });
                        }

                        await security.users.deleteUser(login);

                        const authPlugin = plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        await authPlugin.deleteUser({ user }, context);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    }
};

export default plugin;
