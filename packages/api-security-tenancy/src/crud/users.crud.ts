import { withFields, string } from "@commodo/fields";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { HandlerSecurityContext } from "@webiny/api-security/types";
import { DbItemSecurityUser2Tenant, HandlerTenancyContext, User, UsersCRUD } from "../types";
import dbArgs from "./dbArgs";

const CreateDataModel = withFields({
    login: string({ validation: validation.create("required,minLength:2") }),
    firstName: string({ validation: validation.create("required,minLength:2") }),
    lastName: string({ validation: validation.create("required,minLength:2") })
})();

const UpdateDataModel = withFields({
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") })
})();

type DbUser = User & {
    PK: string;
    SK: string;
};

export default (
    context: HandlerContextDb & HandlerSecurityContext & HandlerTenancyContext
): UsersCRUD => {
    const { db } = context;
    return {
        async getUser(login: string) {
            const [[user]] = await db.read<User>({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                limit: 1
            });

            return user;
        },
        async listUsers({ tenant }) {
            const tenantId = tenant ?? context.security.getTenant().id;

            const [users] = await db.read<DbUser>({
                ...dbArgs,
                query: { PK: `T#${tenantId}`, SK: { $beginsWith: "U#" } }
            });

            const batch = db.batch();
            for (let i = 0; i < users.length; i++) {
                batch.read({
                    ...dbArgs,
                    query: {
                        PK: users[i].SK,
                        SK: "A"
                    }
                });
            }

            const results = await batch.execute();

            return results.map(res => res[0][0]);
        },
        async createUser(data) {
            const identity = context.security.getIdentity();

            if (await this.get(data.login)) {
                throw {
                    message: "User with that login already exists.",
                    code: "USER_EXISTS"
                };
            }

            await new CreateDataModel().populate(data).validate();

            const user: User = {
                ...data,
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
                data: {
                    PK: `U#${user.login}`,
                    SK: "A",
                    TYPE: "SecurityUser",
                    ...user
                }
            });

            return user;
        },
        async updateUser(login, data) {
            const model = await new UpdateDataModel().populate(data);
            await model.validate();

            const updatedAttributes = await model.toJSON({ onlyDirty: true });

            await db.update({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                data: updatedAttributes
            });

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

            return true;
        },
        async linkUserToTenant(login, tenant, group) {
            await db.create({
                data: {
                    PK: `U#${login}`,
                    SK: `LINK#T#${tenant.id}#G#${group.slug}`,
                    TYPE: "SecurityUser2Tenant",
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    group: group.slug,
                    permissions: group.permissions
                }
            });
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
        },
        async getUserPermissions(login) {
            const [links] = await db.read<DbItemSecurityUser2Tenant>({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: { $beginsWith: `LINK#` }
                }
            });

            return links.map(link => ({
                id: link.tenantId,
                name: link.tenantName,
                permissions: link.permissions
            }));
        }
    };
};
