import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import dbArgs from "./dbArgs";
import { AdminUsersContext, DbItemSecurityUser2Tenant, Group, GroupsCRUD } from "../types";
import { paginateBatch } from "./paginateBatch";
import WebinyError from "@webiny/error";

const CreateDataModel = withFields({
    tenant: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    permissions: object({
        list: true,
        validation: validation.create("required")
    })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    permissions: object({ list: true })
})();

export default (context: AdminUsersContext): GroupsCRUD => {
    const { db } = context;

    return {
        async getGroup(tenant, slug) {
            const [[group]] = await db.read<Group>({
                ...dbArgs,
                query: { PK: `T#${tenant.id}`, SK: `G#${slug}` },
                limit: 1
            });

            return group;
        },
        async listGroups(tenant) {
            const [groups] = await db.read<Group>({
                ...dbArgs,
                query: { PK: `T#${tenant.id}`, SK: { $beginsWith: "G#" } }
            });

            return groups;
        },
        async createGroup(tenant, data) {
            const identity = context.security.getIdentity();

            const existing = await this.getGroup(tenant, data.slug);
            if (existing) {
                throw new WebinyError(
                    `Group with slug "${data.slug}" already exists.`,
                    "GROUP_EXISTS"
                );
            }

            await new CreateDataModel().populate({ ...data, tenant: tenant.id }).validate();

            const group: Group = {
                tenant: tenant.id,
                system: false,
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
                ...dbArgs,
                data: {
                    PK: `T#${tenant.id}`,
                    SK: `G#${data.slug}`,
                    TYPE: "security.group",
                    ...group
                }
            });

            return group;
        },
        async updateGroup(tenant, slug, data) {
            const model = await new UpdateDataModel().populate(data);
            await model.validate();

            await db.update({
                ...dbArgs,
                query: { PK: `T#${tenant.id}`, SK: `G#${slug}` },
                data: await model.toJSON({ onlyDirty: true })
            });

            return true;
        },
        async deleteGroup(tenant, slug) {
            await db.delete({
                ...dbArgs,
                query: {
                    PK: `T#${tenant.id}`,
                    SK: `G#${slug}`
                }
            });

            return true;
        },
        async updateUserLinks(tenant, group) {
            const [links] = await db.read<DbItemSecurityUser2Tenant>({
                ...dbArgs,
                query: {
                    GSI1_PK: `T#${tenant.id}`,
                    GSI1_SK: { $beginsWith: `G#${group.slug}#` }
                }
            });

            await paginateBatch<DbItemSecurityUser2Tenant>(links, 25, async links => {
                const batch = db.batch();
                for (let i = 0; i < links.length; i++) {
                    batch.update({
                        ...dbArgs,
                        query: { PK: links[i].PK, SK: links[i].SK },
                        data: Object.assign(links[i], {
                            group: {
                                slug: group.slug,
                                name: group.name,
                                permissions: group.permissions
                            }
                        })
                    });
                }
                await batch.execute();
            });
        }
    };
};
