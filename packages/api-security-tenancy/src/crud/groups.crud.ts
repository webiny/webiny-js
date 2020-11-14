import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { HandlerSecurityContext } from "@webiny/api-security/types";
import dbArgs from "./dbArgs";
import { DbItemSecurityUser2Tenant, Group, GroupsCRUD, HandlerTenancyContext } from "../types";
import { paginateBatch } from "./paginateBatch";

const CreateDataModel = withFields({
    tenant: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    description: string({ validation: validation.create("required,minLength:10") }),
    permissions: object({
        list: true,
        validation: validation.create("required,minLength:1"),
        value: []
    })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:3") }),
    description: string({ validation: validation.create("minLength:10") }),
    permissions: object({
        list: true,
        validation: validation.create("minLength:1"),
        value: []
    })
})();

export default (
    context: HandlerContextDb & HandlerSecurityContext & HandlerTenancyContext
): GroupsCRUD => {
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

            if (await this.get(data.slug)) {
                throw {
                    message: `Group with slug "${data.slug}" already exists.`,
                    code: "GROUP_EXISTS"
                };
            }

            await new CreateDataModel().populate(data).validate();

            const group = {
                tenant: tenant.id,
                system: false,
                ...data,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                }
            };

            await db.create({
                data: {
                    PK: `T#${tenant.id}`,
                    SK: `G#${data.slug}`,
                    TYPE: "SecurityGroup",
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
        async updatePermissionsOnUsersInGroup(tenant, slug, permissions) {
            const [links] = await db.read<DbItemSecurityUser2Tenant>({
                ...dbArgs,
                query: {
                    GSI1_PK: `T#${tenant.id}`,
                    GSI1_SK: { $beginsWith: `G#${slug}#` }
                }
            });

            await paginateBatch<DbItemSecurityUser2Tenant>(links, 25, async links => {
                const batch = db.batch();
                for (let i = 0; i < links.length; i++) {
                    batch.update({
                        ...dbArgs,
                        query: { PK: links[i].PK, SK: links[i].SK },
                        data: Object.assign(links[i], { permissions })
                    });
                }
                await batch.execute();
            });
        }
    };
};
