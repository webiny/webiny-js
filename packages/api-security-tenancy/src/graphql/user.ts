import md5 from "md5";
import { hasPermission } from "@webiny/api-security";
import {
    CreateUserData,
    HandlerTenancyContext,
    SecurityIdentityProviderPlugin,
    UpdateUserData,
    User
} from "../types";
import { HandlerSecurityContext } from "@webiny/api-security/types";
import {
    Response,
    NotFoundResponse,
    ErrorResponse,
    ListResponse,
    ListErrorResponse
} from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";

const gravatar = (user: User) => {
    return "https://www.gravatar.com/avatar/" + md5(user.login);
};

export default {
    typeDefs: /* GraphQL */ `
        type TenantWithPermissions {
            id: ID
            name: String
            permissions: [JSON]
        }

        type SecurityIdentity {
            id: ID
            login: String
            permissions: [TenantWithPermissions]
            firstName: String
            lastName: String
            fullName: String
            avatar: JSON
            gravatar: String
        }

        type SecurityUser {
            login: String
            firstName: String
            lastName: String
            fullName: String
            gravatar: String
            avatar: JSON
            createdOn: DateTime
        }

        """
        Contains user settings by specific key, ex: search-filters.
        """
        type SecurityUserSettings {
            key: String
            data: JSON
        }

        """
        This input type is used by administrators to update other user's accounts within the same tenant.
        """
        input SecurityUserInput {
            login: String
            firstName: String
            lastName: String
            avatar: JSON
        }

        """
        This input type is used by the user who is updating his own account
        """
        input SecurityCurrentUserInput {
            login: String
            firstName: String
            lastName: String
            avatar: JSON
        }

        type SecurityUserResponse {
            data: SecurityUser
            error: SecurityUserError
        }

        type SecurityUserError {
            code: String
            message: String
            data: JSON
        }

        type SecurityUserDeleteResponse {
            data: Boolean
            error: SecurityUserError
        }

        type SecurityUserListResponse {
            data: [SecurityUser]
            error: SecurityUserError
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityQuery {
            "Get a single user by id or specific search criteria"
            getUser(login: String): SecurityUserResponse

            "Get a list of users"
            listUsers: SecurityUserListResponse
        }

        extend type SecurityMutation {
            "Login using ID token obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse

            "Update current user"
            updateCurrentUser(data: SecurityCurrentUserInput!): SecurityUserResponse

            createUser(data: SecurityUserInput!): SecurityUserResponse

            updateUser(login: String!, data: SecurityUserInput!): SecurityUserResponse

            deleteUser(login: String!): SecurityUserDeleteResponse
        }
    `,
    resolvers: {
        /*PersonalAccessToken: {
            token: pat => {
                return pat.token.substr(-4);
            }
        },*/
        SecurityUser: {
            gravatar,
            fullName(user: User) {
                return `${user.firstName} ${user.lastName}`;
            },
            async avatar(user: User) {
                return user.avatar;
            }
        },
        SecurityIdentity: {
            gravatar,
            fullName(user: User) {
                return `${user.firstName} ${user.lastName}`;
            },
            login: (_, args, context: HandlerSecurityContext) => {
                return context.security.getIdentity().login;
            },
            async avatar(user: User) {
                return user.avatar;
            },
            async permissions(user: User, args, context: HandlerTenancyContext) {
                return context.security.users.getUserPermissions(user.login);
            }
        },
        SecurityQuery: {
            getUser: hasPermission<any, { login: string }, HandlerTenancyContext>(
                "security.user.manage"
            )(async (_, args, context) => {
                const { login } = args;

                try {
                    const user = await context.security.users.getUser(login);
                    if (!user) {
                        return new NotFoundResponse(`User "${login}" was not found!`);
                    }
                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data || null
                    });
                }
            }),
            listUsers: hasPermission<any, any, HandlerTenancyContext>("security.user.manage")(
                async (_, args, context) => {
                    try {
                        const tenant = context.security.getTenant();
                        const userList = await context.security.users.listUsers({
                            tenant: tenant.id
                        });

                        return new ListResponse(userList);
                    } catch (e) {
                        return new ListErrorResponse({
                            code: e.code,
                            message: e.message,
                            data: e.data || null
                        });
                    }
                }
            )
        },
        SecurityMutation: {
            login: async (
                root,
                args,
                context: HandlerContext & HandlerSecurityContext & HandlerTenancyContext
            ) => {
                try {
                    const identity = context.security.getIdentity();

                    if (!identity) {
                        throw new Error("Not authorized!");
                    }

                    let user = await context.security.users.getUser(identity.login);

                    let firstLogin = false;

                    if (!user) {
                        firstLogin = true;
                        // Create a "Security User"
                        user = await context.security.users.createUser({
                            login: identity.login,
                            firstName: identity.firstName || "",
                            lastName: identity.lastName || "",
                            avatar: identity.avatar
                        });
                    }

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    if (typeof authPlugin.onLogin === "function") {
                        await authPlugin.onLogin({ user, firstLogin }, context);
                    }

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse({
                        message: e.message,
                        code: e.code,
                        data: e.data
                    });
                }
            },
            updateCurrentUser: async (
                root,
                args: { data: UpdateUserData },
                context: HandlerContext & HandlerSecurityContext & HandlerTenancyContext
            ) => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    throw new Error("Not authorized!");
                }

                const user = await context.security.users.getUser(identity.login);
                if (!user) {
                    return new NotFoundResponse("User not found!");
                }

                try {
                    // We need to explicitly pick attributes we want to handle, as plugins can add their own
                    // fields to GraphQL Schema, and we don't want to have those in the mix.
                    const { firstName, lastName, avatar } = args.data;

                    const updatedAttributes = await context.security.users.updateUser(user.login, {
                        firstName,
                        lastName,
                        avatar
                    });

                    // Assign updated attributes to the original user data object
                    Object.assign(user, updatedAttributes);

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    if (authPlugin) {
                        await authPlugin.updateUser({ data: args.data, user }, context);
                    }

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data || null
                    });
                }
            },
            createUser: hasPermission<
                any,
                { data: CreateUserData },
                HandlerContext & HandlerSecurityContext & HandlerTenancyContext
            >("security.user.manage")(async (root, { data }, context) => {
                try {
                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    // First let's try creating a user with our IDP
                    await authPlugin.createUser({ data }, context);

                    // Now we can store the user in our DB
                    const user = await context.security.users.createUser(data);

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }),
            updateUser: hasPermission<
                any,
                { login: string; data: UpdateUserData },
                HandlerContext & HandlerSecurityContext & HandlerTenancyContext
            >("security.user.manage")(async (root, { data, login }, context) => {
                try {
                    const user = await context.security.users.getUser(login);

                    if (!user) {
                        return new NotFoundResponse(`User "${login}" was not found!`);
                    }

                    const updatedAttributes = await context.security.users.updateUser(login, data);

                    Object.assign(user, updatedAttributes);

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    if (authPlugin) {
                        await authPlugin.updateUser({ data, user }, context);
                    }

                    return new Response(user);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }),
            deleteUser: hasPermission<
                any,
                { login: string },
                HandlerContext & HandlerTenancyContext
            >("security.user.manage")(async (root, { login }, context) => {
                try {
                    const user = await context.security.users.getUser(login);

                    if (!user) {
                        return new NotFoundResponse(`User "${login}" was not found!`);
                    }

                    await context.security.users.deleteUser(login);

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    await authPlugin.deleteUser({ user }, context);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            })
        }
    }
};
