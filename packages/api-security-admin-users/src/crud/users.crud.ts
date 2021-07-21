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
    CreatePersonalAccessTokenInput,
    CreateUserInput,
    Group,
    TenantAccess,
    UpdatePersonalAccessTokenInput,
    UpdateUserInput,
    User,
    UserPersonalAccessToken
} from "~/types";

import dbArgs from "./dbArgs";
import { UserLoaders } from "./users.loaders";
import validationPlugin from "./users.validation";
import { UserStorageOperationsProvider } from "~/plugins/UserStorageOperationsProvider";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
};

type DbUser = DbItem<User>;
type DbUserAccessToken = DbItem<UserPersonalAccessToken>;

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

export default new ContextPlugin<AdminUsersContext>(async context => {
    const providers = context.plugins.byType<UserStorageOperationsProvider>(
        UserStorageOperationsProvider.type
    );
    /**
     * Always take the last given provider - although if everything is loaded as it must, there should not be more than one.
     * We do not check/verify for multiple providers.
     */
    const provider = providers.pop();
    if (!provider) {
        throw new WebinyError(
            "Could not find a UserStorageOperationsProvider plugin registered.",
            "PROVIDER_PLUGIN_ERROR",
            {
                type: UserStorageOperationsProvider.type
            }
        );
    }

    const storageOperations = await provider.provide({
        context
    });

    const userPlugins = context.plugins.byType<UserPlugin>(UserPlugin.type);
    /**
     * Validation plugin for creating/updating the user.
     */
    context.plugins.register(validationPlugin);
    /**
     * We need the data loaders to cache what ever we can.
     */
    const loaders = new UserLoaders({ context, storageOperations });

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

        async createToken(
            login: string,
            data: CreatePersonalAccessTokenInput
        ): Promise<UserPersonalAccessToken> {
            const { name, token } = data;
            await new CreateAccessTokenDataModel().populate({ name, token }).validate();

            const tokenData = {
                ...data,
                id: mdbid(),
                name,
                token,
                login,
                createdOn: new Date().toISOString()
            };

            await context.db.create({
                ...dbArgs,
                data: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenData.id}`,
                    GSI1_PK: `PAT`,
                    GSI1_SK: token,
                    TYPE: "security.pat",
                    ...tokenData
                }
            });

            return tokenData;
        },

        async createUser(data: CreateUserInput, options: { auth?: boolean } = {}): Promise<User> {
            const { security, tenancy } = context;

            const auth = "auth" in options ? options.auth : true;

            if (auth) {
                const permission = await security.getPermission("security.user");
                if (!permission) {
                    throw new NotAuthorizedError();
                }
            }

            const login = data.login.toLowerCase();
            const identity = security.getIdentity();

            const existing = await context.security.users.getUser(login, {
                auth: false
            });

            if (existing) {
                throw {
                    message: "User with that login already exists.",
                    code: "USER_EXISTS"
                };
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
                id: mdbid(),
                login,
                createdOn: new Date().toISOString(),
                createdBy
            };

            await executeCallback<UserPlugin["beforeCreate"]>(userPlugins, "beforeCreate", {
                context,
                user,
                inputData: data
            });

            try {
                await storageOperations.create({
                    user
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create user.",
                    ex.code || "CREATE_USER_ERROR",
                    {
                        user
                    }
                );
            }

            await executeCallback<UserPlugin["afterCreate"]>(userPlugins, "afterCreate", {
                context,
                user,
                inputData: data
            });

            const tenant = tenancy.getCurrentTenant();
            const group = await security.groups.getGroup(data.group);
            await security.users.linkUserToTenant(user.login, tenant, group);

            return user;
        },

        async deleteToken(login: string, tokenId: string): Promise<boolean> {
            await context.db.delete({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                }
            });

            return true;
        },

        async deleteUser(login: string): Promise<boolean> {
            const { db, security } = context;

            const permission = await security.getPermission("security.user");
            if (!permission) {
                throw new NotAuthorizedError();
            }

            const user = await context.security.users.getUser(login);
            const identity = security.getIdentity();

            if (!user) {
                throw new NotFoundError(`User "${login}" was not found!`);
            }

            if (user.login === identity.id) {
                throw new WebinyError(`You can't delete your own user account.`);
            }

            await executeCallback<UserPlugin["beforeDelete"]>(userPlugins, "beforeDelete", {
                context,
                user
            });

            const [items] = await db.read({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: { $gt: " " }
                }
            });

            const batch = db.batch();
            for (let i = 0; i < items.length; i++) {
                batch.delete({
                    ...dbArgs,
                    query: {
                        PK: items[i].PK,
                        SK: items[i].SK
                    }
                });
            }

            await batch.execute();

            loaders.clearLoadersCache(login);

            await executeCallback<UserPlugin["afterDelete"]>(userPlugins, "afterDelete", {
                context,
                user
            });

            return true;
        },

        async getPersonalAccessToken(
            login: string,
            tokenId: string
        ): Promise<UserPersonalAccessToken> {
            const [[token]] = await context.db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                }
            });

            return token;
        },

        async getUser(login: string, options: { auth?: boolean } = {}): Promise<User> {
            const { security } = context;
            const auth = "auth" in options ? options.auth : true;

            if (auth) {
                const permission = await security.getPermission("security.user");

                if (!permission) {
                    throw new NotAuthorizedError();
                }
            }

            return loaders.getUser.load(login);
        },

        async getUserAccess(login: string): Promise<TenantAccess[]> {
            return loaders.getUserAccess.load(login);
        },

        async getUserByPersonalAccessToken(token: string): Promise<User> {
            const [[pat]] = await context.db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    GSI1_PK: "PAT",
                    GSI1_SK: token
                }
            });

            if (!pat) {
                return null;
            }

            return await context.security.users.getUser(pat.login, { auth: false });
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

        async unlinkUserFromTenant(id: string, tenant: Tenant): Promise<void> {
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
                        tenant,
                        user
                    }
                );
            }
            await loaders.deleteDataLoaderAccessCache(id, tenant);
        },

        async listTokens(login: string): Promise<UserPersonalAccessToken[]> {
            const [tokens] = await context.db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: { $beginsWith: "PAT#" }
                }
            });

            return tokens;
        },

        async listUsers(params: { tenant?: string; auth?: boolean } = {}): Promise<User[]> {
            const { db, security, tenancy } = context;

            const auth = "auth" in params ? params.auth : true;

            if (auth) {
                const permission = await security.getPermission("security.user");

                if (!permission) {
                    throw new NotAuthorizedError();
                }
            }

            const tenant = params.tenant || tenancy.getCurrentTenant().id;

            const [users] = await db.read<DbUser>({
                ...dbArgs,
                query: { GSI1_PK: `T#${tenant}`, GSI1_SK: { $beginsWith: "G#" } }
            });

            const batch = db.batch();
            for (let i = 0; i < users.length; i++) {
                batch.read({
                    ...dbArgs,
                    query: {
                        PK: users[i].PK,
                        SK: "A"
                    }
                });
            }

            const results = await batch.execute();

            return results.map(res => res[0][0]);
        },

        async updateToken(
            login: string,
            tokenId: string,
            data: UpdatePersonalAccessTokenInput
        ): Promise<UpdatePersonalAccessTokenInput> {
            const { name } = data;
            await new UpdateAccessTokenDataModel().populate({ name }).validate();

            await context.db.update({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                },
                data: { name }
            });

            return { name };
        },

        async updateUser(login: string, data: UpdateUserInput): Promise<User> {
            const { security, tenancy, db } = context;
            const permission = await security.getPermission("security.user");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const user = await security.users.getUser(login);
            if (!user) {
                throw new NotFoundError(`User "${login}" was not found!`);
            }

            const updateData = cloneDeep(data);

            await executeCallback<UserPlugin["beforeUpdate"]>(userPlugins, "beforeUpdate", {
                context,
                user,
                updateData,
                inputData: data
            });

            Object.assign(user, updateData);

            await db.update({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                data: user
            });

            await executeCallback<UserPlugin["afterUpdate"]>(userPlugins, "afterUpdate", {
                context,
                user,
                inputData: data
            });

            await loaders.updateDataLoaderUserCache(login, updateData);
            loaders.clearDataLoaderAccessCache(login);

            if (data.group) {
                const tenant = tenancy.getCurrentTenant();
                await security.users.unlinkUserFromTenant(user.login, tenant);

                const group = await security.groups.getGroup(data.group);

                await security.users.linkUserToTenant(user.login, tenant, group);
            }

            return user;
        }
    };
});
