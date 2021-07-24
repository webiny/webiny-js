import mdbid from "mdbid";
import cloneDeep from "lodash.clonedeep";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { Tenant } from "@webiny/api-tenancy/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { UserPlugin } from "~/plugins/UserPlugin";
import {
    AdminUsersContext,
    CrudOptions,
    Group,
    TenantAccess,
    User,
    UserPersonalAccessToken,
    UserStorageOperations
} from "~/types";
import { UserLoaders } from "./users.loaders";
import validationPlugin from "./users.validation";
import { UserStorageOperationsProvider } from "~/plugins/UserStorageOperationsProvider";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import crypto from "crypto";
import { getStorageOperations } from "~/crud/storageOperations";

const CreateAccessTokenDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    token: string({ validation: validation.create("required,maxLength:64") })
})();

const UpdateAccessTokenDataModel = withFields({
    name: string({ validation: validation.create("required") })
})();

const executeCallback = async <TCallbackFunction extends (params: any) => void | Promise<void>>(
    plugins: UserPlugin[],
    callback: string,
    params: Parameters<TCallbackFunction>[0]
) => {
    for (const plugin of plugins) {
        if (typeof plugin[callback] === "function") {
            await plugin[callback](params);
        }
    }
};

const generateToken = (tokenLength = 48) => {
    const token = crypto
        .randomBytes(Math.ceil(tokenLength / 2))
        .toString("hex")
        .slice(0, tokenLength - 1);

    // Personal access tokens are prefixed with a letter "p" to make token verification easier.
    // When authentication plugins kick in, they will be able to tell if they should handle the token by
    // checking the first letter and either process the token or skip authentication completely.
    return `p${token}`;
};

export default new ContextPlugin<AdminUsersContext>(async context => {
    const storageOperations = await getStorageOperations<UserStorageOperations>(
        context,
        UserStorageOperationsProvider.type
    );

    const userPlugins = context.plugins.byType<UserPlugin>(UserPlugin.type);
    /**
     * Validation plugin for creating/updating the user.
     */
    context.plugins.register(validationPlugin);
    /**
     * We need the data loaders to cache what ever we can.
     */
    const loaders = new UserLoaders({ context, storageOperations });

    const checkPermission = async (options?: CrudOptions) => {
        if (options && options.auth === false) {
            return;
        }
        const permission = await context.security.getPermission("security.user");

        if (!permission) {
            throw new NotAuthorizedError();
        }
    };

    context.security.users = {
        async login(): Promise<User> {
            const { security } = context;
            const identity = security.getIdentity();

            if (!identity) {
                throw new NotAuthorizedError();
            }

            let user = await context.security.users.getUser(identity.id, { auth: false });

            let firstLogin = false;

            if (!user) {
                firstLogin = true;
                // Create a "Security User"
                user = await context.security.users.createUser(
                    {
                        login: identity.id,
                        firstName: identity.firstName || "",
                        lastName: identity.lastName || "",
                        avatar: identity.avatar
                    },
                    { auth: false }
                );
            }

            await executeCallback<UserPlugin["onLogin"]>(userPlugins, "onLogin", {
                context,
                user,
                firstLogin
            });

            return user;
        },

        async createToken(data): Promise<UserPersonalAccessToken> {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }
            await new CreateAccessTokenDataModel().populate(data).validate();

            const token: UserPersonalAccessToken = {
                ...data,
                token: generateToken(),
                id: mdbid(),
                login: identity.id,
                createdOn: new Date().toISOString()
            };
            try {
                return await storageOperations.createToken({
                    identity,
                    token
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messagge || "Could not create user access token.",
                    ex.code || "CREATE_USER_ACCESS_TOKEN_ERROR",
                    {
                        ...(ex.data || {}),
                        token
                    }
                );
            }
        },

        async createUser(data, options): Promise<User> {
            const { security, tenancy } = context;

            await checkPermission(options);

            const login = data.login.toLowerCase();
            const identity = security.getIdentity();

            try {
                const existing = await storageOperations.getUser({
                    id: login
                });

                if (existing) {
                    throw new Error();
                }
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "User with that login already exists.",
                    ex.code || "USER_EXISTS",
                    {
                        ...(ex.data || {}),
                        id: login
                    }
                );
            }
            let createdBy = null;
            if (identity) {
                createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };
            }

            const user: User = {
                ...data,
                id: login,
                login,
                createdOn: new Date().toISOString(),
                createdBy
            };
            let result: User;
            try {
                await executeCallback<UserPlugin["beforeCreate"]>(userPlugins, "beforeCreate", {
                    context,
                    user,
                    inputData: data
                });
                result = await storageOperations.createUser({
                    user
                });
                await executeCallback<UserPlugin["afterCreate"]>(userPlugins, "afterCreate", {
                    context,
                    user: result,
                    inputData: data
                });
                const tenant = tenancy.getCurrentTenant();
                const group = await security.groups.getGroup(data.group, options);
                await security.users.linkUserToTenant(result.login, tenant, group);
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create user.",
                    ex.code || "CREATE_USER_ERROR",
                    {
                        ...(ex.data || {}),
                        user: result || user
                    }
                );
            }
        },

        async deleteToken(id): Promise<boolean> {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const token = await context.security.users.getPersonalAccessToken(identity.id, id);

            if (!token) {
                throw new NotFoundError(`PAT "${id}" was not found!`);
            }

            try {
                await storageOperations.deleteToken({
                    identity,
                    token
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete user access token.",
                    ex.code || "DELETE_USER_ACCESS_TOKEN_ERROR",
                    {
                        ...(ex.data || {}),
                        identity,
                        token
                    }
                );
            }

            return true;
        },

        async deleteUser(login): Promise<boolean> {
            const { security } = context;

            await checkPermission();

            const user = await context.security.users.getUser(login);
            const identity = security.getIdentity();

            if (!user) {
                throw new NotFoundError(`User "${login}" was not found!`);
            }

            if (user.login === identity.id) {
                throw new WebinyError(`You can't delete your own user account.`);
            }

            try {
                await executeCallback<UserPlugin["beforeDelete"]>(userPlugins, "beforeDelete", {
                    context,
                    user
                });

                await storageOperations.deleteUser({
                    user
                });

                loaders.clearLoadersCache(login);

                await executeCallback<UserPlugin["afterDelete"]>(userPlugins, "afterDelete", {
                    context,
                    user
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messagge || "Could not delete user.",
                    ex.code || "DELETE_USER_ERROR",
                    {
                        ...(ex.data || {}),
                        user
                    }
                );
            }

            return true;
        },

        async getPersonalAccessToken(login, tokenId): Promise<UserPersonalAccessToken> {
            try {
                return storageOperations.getPersonalAccessToken({
                    login,
                    tokenId
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messagge || "Could not get user access token.",
                    ex.code || "GET_USER_ACCESS_TOKEN_ERROR",
                    {
                        ...(ex.data || {}),
                        login,
                        tokenId
                    }
                );
            }
        },

        async getUser(login, options): Promise<User> {
            await checkPermission(options);

            return loaders.getUser.load(login);
        },

        async getUserAccess(login): Promise<TenantAccess[]> {
            return loaders.getUserAccess.load(login);
        },

        async getUserByPersonalAccessToken(token): Promise<User> {
            try {
                return await storageOperations.getUserByPersonalAccessToken({
                    token
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get user via PAT.",
                    ex.code || "GET_USER_VIA_PAT_ERROR",
                    {
                        ...(ex.data || {}),
                        token
                    }
                );
            }
        },

        async linkUserToTenant(id: string, tenant: Tenant, group: Group): Promise<void> {
            const user = await context.security.users.getUser(id, {
                auth: false
            });
            if (!user) {
                throw new WebinyError("User not found.", "USER_NOT_FOUND", {
                    id
                });
            }
            const link: TenantAccess = {
                id: user.id || user.login,
                tenant: {
                    id: tenant.id,
                    name: tenant.name
                },
                group: {
                    slug: group.slug,
                    name: group.name,
                    permissions: group.permissions
                }
            };

            try {
                await storageOperations.linkUserToTenant({
                    user,
                    tenant,
                    group,
                    link
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot link user to tenant.",
                    ex.code || "LINK_USER_TO_TENANT_ERROR",
                    {
                        ...(ex.data || {}),
                        link,
                        user
                    }
                );
            }
            /**
             * Add the data into cache so it is not loaded again if required in this request.
             */
            await loaders.addDataLoaderAccessCache(id, link);
        },

        async unlinkUserFromTenant(id, tenant): Promise<void> {
            const user = await context.security.users.getUser(id, {
                auth: false
            });
            if (!user) {
                throw new WebinyError("User not found.", "USER_NOT_FOUND", {
                    id
                });
            }

            try {
                await storageOperations.unlinkUserFromTenant({
                    tenant,
                    user
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot unlink user from tenant.",
                    ex.code || "UNLINK_USER_FROM_TENANT_ERROR",
                    {
                        ...(ex.data || {}),
                        tenant,
                        user
                    }
                );
            }
            await loaders.deleteDataLoaderAccessCache(id, tenant);
        },

        async listTokens(login): Promise<UserPersonalAccessToken[]> {
            try {
                return storageOperations.listTokens({
                    login
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot list user tokens.",
                    ex.code || "LIST_TOKENS_ERROR",
                    {
                        ...(ex.data || {}),
                        login
                    }
                );
            }
        },

        async listUsers(params, options): Promise<User[]> {
            const { tenancy } = context;

            await checkPermission(options);

            const { tenant: tenantParam } = params || {};

            const tenant = tenantParam || tenancy.getCurrentTenant().id;

            try {
                return storageOperations.listUsers({
                    where: {
                        tenant
                    },
                    sort: ["createdOn_ASC"]
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot list users.",
                    ex.code || "LIST_USERS_ERROR",
                    {
                        ...(ex.data || {}),
                        tenant
                    }
                );
            }
        },

        async updateToken(tokenId, data) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const { name } = data;
            await new UpdateAccessTokenDataModel().populate({ name }).validate();

            const original = await context.security.users.getPersonalAccessToken(
                identity.id,
                tokenId
            );
            if (!original) {
                throw new NotFoundError();
            }

            const token: UserPersonalAccessToken = {
                ...original,
                name
            };
            try {
                return await storageOperations.updateToken({
                    original,
                    token
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot update token.",
                    ex.code || "UPDATE_TOKEN_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        token
                    }
                );
            }
        },

        async updateUser(login, data): Promise<User> {
            const { security, tenancy } = context;
            const permission = await security.getPermission("security.user");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const original = await security.users.getUser(login);
            if (!original) {
                throw new NotFoundError(`User "${login}" was not found!`);
            }

            const updateData = cloneDeep(data);

            const user: User = {
                ...original,
                ...updateData
            };

            try {
                await executeCallback<UserPlugin["beforeUpdate"]>(userPlugins, "beforeUpdate", {
                    context,
                    user,
                    updateData,
                    inputData: data
                });
                const result = await storageOperations.updateUser({
                    original,
                    user
                });
                await executeCallback<UserPlugin["afterUpdate"]>(userPlugins, "afterUpdate", {
                    context,
                    user,
                    inputData: data
                });
                /**
                 * Cache clear and updating.
                 */
                await loaders.updateDataLoaderUserCache(login, updateData);
                loaders.clearDataLoaderAccessCache(login);
                /**
                 * If there is a group defined, remove the existing one and add the new one.
                 */
                if (data.group) {
                    const tenant = tenancy.getCurrentTenant();
                    await security.users.unlinkUserFromTenant(result.login, tenant);

                    const group = await security.groups.getGroup(data.group);

                    await security.users.linkUserToTenant(result.login, tenant, group);
                }
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.messsage || "Cannot update user.",
                    ex.code || "UPDATE_USER_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        user
                    }
                );
            }
        }
    };
});
