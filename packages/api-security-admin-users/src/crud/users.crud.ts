import mdbid from "mdbid";
import cloneDeep from "lodash.clonedeep";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { Tenant } from "@webiny/api-tenancy/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { Base } from "./base.crud";
import { UserPlugin } from "../plugins/UserPlugin";
import {
    AdminUsersContext,
    CreatePersonalAccessTokenInput,
    CreateUserInput,
    DbItemSecurityUser2Tenant,
    Group,
    TenantAccess,
    UpdatePersonalAccessTokenInput,
    UpdateUserInput,
    User,
    UserPersonalAccessToken,
    UsersCRUD
} from "../types";

import dbArgs from "./dbArgs";
import { UserLoaders } from "./users.loaders";
import validationPlugin from "./users.validation";

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

export class Users extends Base implements UsersCRUD {
    private loaders: UserLoaders;

    constructor(context: AdminUsersContext) {
        super(context);

        context.plugins.register(validationPlugin);
        this.loaders = new UserLoaders(context);
    }

    get plugins(): UserPlugin[] {
        return this.context.plugins.byType<UserPlugin>(UserPlugin.type);
    }

    async login(): Promise<User> {
        const { security } = this.context;
        const identity = security.getIdentity();

        if (!identity) {
            throw new NotAuthorizedError();
        }

        let user = await this.getUser(identity.id, { auth: false });

        let firstLogin = false;

        if (!user) {
            firstLogin = true;
            // Create a "Security User"
            user = await this.createUser(
                {
                    login: identity.id,
                    firstName: identity.firstName || "",
                    lastName: identity.lastName || "",
                    avatar: identity.avatar
                },
                { auth: false }
            );
        }

        await this.executeCallback<UserPlugin["onLogin"]>("onLogin", {
            context: this.context,
            user,
            firstLogin
        });

        return user;
    }

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

        await this.context.db.create({
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
    }

    async createUser(data: CreateUserInput, options: { auth?: boolean } = {}): Promise<User> {
        const { db, security, tenancy } = this.context;

        const auth = "auth" in options ? options.auth : true;

        if (auth) {
            const permission = await security.getPermission("security.user");
            if (!permission) {
                throw new NotAuthorizedError();
            }
        }

        const login = data.login.toLowerCase();
        const identity = security.getIdentity();

        if (await this.getUser(login, { auth: false })) {
            throw {
                message: "User with that login already exists.",
                code: "USER_EXISTS"
            };
        }

        const user: User = {
            ...data,
            login,
            createdOn: new Date().toISOString(),
            createdBy: identity
                ? {
                      id: identity.id,
                      displayName: identity.displayName,
                      type: identity.type
                  }
                : null
        };

        await this.executeCallback<UserPlugin["beforeCreate"]>("beforeCreate", {
            context: this.context,
            user,
            inputData: data
        });

        await db.create({
            ...dbArgs,
            data: {
                PK: `U#${user.login}`,
                SK: "A",
                TYPE: "security.user",
                ...user
            }
        });

        await this.executeCallback<UserPlugin["afterCreate"]>("afterCreate", {
            context: this.context,
            user,
            inputData: data
        });

        const tenant = tenancy.getCurrentTenant();
        const group = await security.groups.getGroup(tenant, data.group);
        await security.users.linkUserToTenant(user.login, tenant, group);

        return user;
    }

    async deleteToken(login: string, tokenId: string): Promise<boolean> {
        await this.context.db.delete({
            ...dbArgs,
            query: {
                PK: `U#${login}`,
                SK: `PAT#${tokenId}`
            }
        });

        return true;
    }

    async deleteUser(login: string): Promise<boolean> {
        const { db, security } = this.context;

        const permission = await security.getPermission("security.user");
        if (!permission) {
            throw new NotAuthorizedError();
        }

        const user = await this.getUser(login);
        const identity = security.getIdentity();

        if (!user) {
            throw new NotFoundError(`User "${login}" was not found!`);
        }

        if (user.login === identity.id) {
            throw new WebinyError(`You can't delete your own user account.`);
        }

        await this.executeCallback<UserPlugin["beforeDelete"]>("beforeDelete", {
            context: this.context,
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

        this.loaders.clearLoadersCache(login);

        await this.executeCallback<UserPlugin["afterDelete"]>("afterDelete", {
            context: this.context,
            user
        });

        return true;
    }

    async getPersonalAccessToken(login: string, tokenId: string): Promise<UserPersonalAccessToken> {
        const [[token]] = await this.context.db.read<DbUserAccessToken>({
            ...dbArgs,
            query: {
                PK: `U#${login}`,
                SK: `PAT#${tokenId}`
            }
        });

        return token;
    }

    async getUser(login: string, options: { auth?: boolean } = {}): Promise<User> {
        const { security } = this.context;
        const auth = "auth" in options ? options.auth : true;

        if (auth) {
            const permission = await security.getPermission("security.user");

            if (!permission) {
                throw new NotAuthorizedError();
            }
        }

        return this.loaders.getUser.load(login);
    }

    async getUserAccess(login: string): Promise<TenantAccess[]> {
        return this.loaders.getUserAccess.load(login);
    }

    async getUserByPersonalAccessToken(token: string): Promise<User> {
        const [[pat]] = await this.context.db.read<DbUserAccessToken>({
            ...dbArgs,
            query: {
                GSI1_PK: "PAT",
                GSI1_SK: token
            }
        });

        if (!pat) {
            return null;
        }

        return await this.getUser(pat.login, { auth: false });
    }

    async linkUserToTenant(login: string, tenant: Tenant, group: Group): Promise<void> {
        const data: TenantAccess = {
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

        await this.context.db.create({
            ...dbArgs,
            data: {
                PK: `U#${login}`,
                SK: `LINK#T#${tenant.id}#G#${group.slug}`,
                GSI1_PK: `T#${tenant.id}`,
                GSI1_SK: `G#${group.slug}#U#${login}`,
                TYPE: "security.user2tenant",
                ...data
            }
        });

        await this.loaders.addDataLoaderAccessCache(login, data);
    }

    async listTokens(login: string): Promise<UserPersonalAccessToken[]> {
        const [tokens] = await this.context.db.read<DbUserAccessToken>({
            ...dbArgs,
            query: {
                PK: `U#${login}`,
                SK: { $beginsWith: "PAT#" }
            }
        });

        return tokens;
    }

    async listUsers(params: { tenant?: string; auth?: boolean } = {}): Promise<User[]> {
        const { db, security, tenancy } = this.context;

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
    }

    async unlinkUserFromTenant(login: string, tenant: Tenant): Promise<void> {
        const { db } = this.context;
        const [[link]] = await db.read<DbItemSecurityUser2Tenant>({
            ...dbArgs,
            query: {
                PK: `U#${login}`,
                SK: { $beginsWith: `LINK#T#${tenant.id}#G#` }
            },
            limit: 1
        });

        await db.delete({
            ...dbArgs,
            query: {
                PK: link.PK,
                SK: link.SK
            }
        });
        await this.loaders.deleteDataLoaderAccessCache(login, tenant);
    }

    async updateToken(
        login: string,
        tokenId: string,
        data: UpdatePersonalAccessTokenInput
    ): Promise<UpdatePersonalAccessTokenInput> {
        const { name } = data;
        await new UpdateAccessTokenDataModel().populate({ name }).validate();

        await this.context.db.update({
            ...dbArgs,
            query: {
                PK: `U#${login}`,
                SK: `PAT#${tokenId}`
            },
            data: { name }
        });

        return { name };
    }

    async updateUser(login: string, data: UpdateUserInput): Promise<User> {
        const { security, tenancy, db } = this.context;
        const permission = await security.getPermission("security.user");

        if (!permission) {
            throw new NotAuthorizedError();
        }

        const user = await security.users.getUser(login);
        if (!user) {
            throw new NotFoundError(`User "${login}" was not found!`);
        }

        const updateData = cloneDeep(data);

        await this.executeCallback<UserPlugin["beforeUpdate"]>("beforeUpdate", {
            context: this.context,
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

        await this.executeCallback<UserPlugin["afterUpdate"]>("afterUpdate", {
            context: this.context,
            user,
            inputData: data
        });

        await this.loaders.updateDataLoaderUserCache(login, updateData);
        this.loaders.clearDataLoaderAccessCache(login);

        if (data.group) {
            const tenant = tenancy.getCurrentTenant();
            await security.users.unlinkUserFromTenant(user.login, tenant);

            const group = await security.groups.getGroup(tenant, data.group);

            await security.users.linkUserToTenant(user.login, tenant, group);
        }

        return user;
    }
}
