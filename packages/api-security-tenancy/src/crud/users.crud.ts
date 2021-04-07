import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { DbContext } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import WebinyError from "@webiny/error";
import { SecurityContext } from "@webiny/api-security/types";
import {
    DbItemSecurityUser2Tenant,
    TenancyContext,
    TenantAccess,
    User,
    UserPersonalAccessToken,
    UsersCRUD
} from "../types";
import dbArgs from "./dbArgs";
import mdbid from "mdbid";
import DataLoader from "dataloader";

const CreateUserDataModel = withFields({
    login: string({ validation: validation.create("required,minLength:2") }),
    firstName: string({ validation: validation.create("required,minLength:2") }),
    lastName: string({ validation: validation.create("required,minLength:2") }),
    avatar: object()
})();

const UpdateUserDataModel = withFields({
    avatar: object(),
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") }),
    group: string()
})();

const CreateAccessTokenDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    token: string({ validation: validation.create("required,maxLength:64") })
})();

const UpdateAccessTokenDataModel = withFields({
    name: string({ validation: validation.create("required") })
})();

type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
};

type DbUser = DbItem<User>;
type DbUserAccessToken = DbItem<UserPersonalAccessToken>;

export default (context: DbContext & SecurityContext & TenancyContext): UsersCRUD => {
    const { db } = context;

    const loaders = {
        getUser: new DataLoader<string, User>(async ids => {
            if (ids.length === 0) {
                return [];
            }
            const batch = db.batch();
            for (const id of ids) {
                batch.read({
                    ...dbArgs,
                    query: {
                        PK: `U#${id}`,
                        SK: "A"
                    },
                    limit: 1
                });
            }
            try {
                const results = await batch.execute();
                return results.map(res => res[0][0]);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not execute batch read in getUser.",
                    ex.code || "BATCH_READ_ERROR",
                    {
                        ids
                    }
                );
            }
        }),
        getUserAccess: new DataLoader<string, TenantAccess[]>(async ids => {
            if (ids.length === 0) {
                return [];
            }
            const batch = db.batch();
            for (const id of ids) {
                batch.read({
                    ...dbArgs,
                    query: {
                        PK: `U#${id}`,
                        SK: { $beginsWith: `LINK#` }
                    }
                });
            }
            try {
                const results = await batch.execute();
                const links = results.map(result => result[0]);
                return links.map(link => ({
                    group: link.group,
                    tenant: link.tenant
                })) as any;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not execute batch read in getUserAccess.",
                    ex.code || "BATCH_READ_ERROR",
                    {
                        ids
                    }
                );
            }
        })
    };

    const clearLoaderUserCache = (ids: string) => {
        for (const id of ids) {
            loaders.getUser.clear(id);
            loaders.getUserAccess.clear(id);
        }
    };

    return {
        async getUser(login) {
            return loaders.getUser.load(login);
        },
        async listUsers({ tenant }) {
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
        async createUser(data) {
            const login = data.login.toLowerCase();
            const identity = context.security.getIdentity();

            if (await this.getUser(login)) {
                throw {
                    message: "User with that login already exists.",
                    code: "USER_EXISTS"
                };
            }

            const model = await new CreateUserDataModel().populate(data);
            await model.validate();

            const user: User = {
                ...(await model.toJSON({ onlyDirty: true })),
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

            await db.create({
                ...dbArgs,
                data: {
                    PK: `U#${user.login}`,
                    SK: "A",
                    TYPE: "security.user",
                    ...user
                }
            });

            return user;
        },
        async updateUser(login, data) {
            const model = await new UpdateUserDataModel().populate(data);
            await model.validate();

            const updatedAttributes = await model.toJSON({ onlyDirty: true });

            await db.update({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                data: updatedAttributes
            });

            clearLoaderUserCache(login);

            return updatedAttributes;
        },
        async deleteUser(login) {
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

            clearLoaderUserCache(login);

            return true;
        },
        async linkUserToTenant(login, tenant, group) {
            await db.create({
                ...dbArgs,
                data: {
                    PK: `U#${login}`,
                    SK: `LINK#T#${tenant.id}#G#${group.slug}`,
                    GSI1_PK: `T#${tenant.id}`,
                    GSI1_SK: `G#${group.slug}#U#${login}`,
                    TYPE: "security.user2tenant",
                    tenant: {
                        id: tenant.id,
                        name: tenant.name
                    },
                    group: {
                        slug: group.slug,
                        name: group.name,
                        permissions: group.permissions
                    }
                }
            });

            clearLoaderUserCache(login);
        },
        async unlinkUserFromTenant(login, tenant) {
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

            clearLoaderUserCache(login);
        },
        async getUserAccess(login) {
            return loaders.getUserAccess.load(login);
        },
        async getUserByPersonalAccessToken(token) {
            const [[pat]] = await db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    GSI1_PK: "PAT",
                    GSI1_SK: token
                }
            });

            if (!pat) {
                return null;
            }

            return await this.getUser(pat.login);
        },
        async getPersonalAccessToken(login, tokenId) {
            const [[token]] = await db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                }
            });

            return token;
        },
        async createToken(login, { name, token }) {
            await new CreateAccessTokenDataModel().populate({ name, token }).validate();

            const tokenData = {
                id: mdbid(),
                name,
                token,
                login,
                createdOn: new Date().toISOString()
            };

            await db.create({
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
        async deleteToken(login: string, tokenId: string) {
            await db.delete({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                }
            });

            return true;
        },
        async listTokens(login) {
            const [tokens] = await db.read<DbUserAccessToken>({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: { $beginsWith: "PAT#" }
                }
            });

            return tokens;
        },
        async updateToken(login, tokenId, { name }) {
            await new UpdateAccessTokenDataModel().populate({ name }).validate();
            await db.update({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: `PAT#${tokenId}`
                },
                data: { name }
            });

            return { name };
        }
    };
};
