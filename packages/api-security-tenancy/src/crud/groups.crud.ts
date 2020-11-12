import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { HandlerSecurityContext } from "@webiny/api-security/types";
import dbArgs from "./dbArgs";
import { Group, GroupsCRUD, HandlerTenancyContext } from "../types";

const CreateDataModel = withFields({
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
        async get(slug) {
            const { id: tenantId } = context.security.getTenant();

            const [[group]] = await db.read<Group>({
                ...dbArgs,
                query: { PK: `T#${tenantId}`, SK: `G#${slug}` },
                limit: 1
            });

            return group;
        },
        async list() {
            const { id: tenantId } = context.security.getTenant();

            const [groups] = await db.read<Group>({
                ...dbArgs,
                query: { PK: `T#${tenantId}`, SK: { $beginsWith: "G#" } }
            });

            return groups;
        },
        async create(data) {
            const identity = context.security.getIdentity();
            const { id: tenantId } = context.security.getTenant();

            if (await this.get(data.slug)) {
                throw {
                    message: `Group with slug "${data.slug}" already exists.`,
                    code: "GROUP_EXISTS"
                };
            }

            await new CreateDataModel().populate(data).validate();

            const group = {
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
                    PK: `T#${tenantId}`,
                    SK: `G#${data.slug}`,
                    ...group
                }
            });

            return group;
        },
        async update(slug, data) {
            const { id: tenantId } = context.security.getTenant();

            const model = await new UpdateDataModel().populate(data);
            await model.validate();

            await db.update({
                ...dbArgs,
                query: { PK: `T#${tenantId}`, SK: `G#${slug}` },
                data: await model.toJSON({ onlyDirty: true })
            });

            return true;
        },
        async delete(slug: string) {
            const { id: tenantId } = context.security.getTenant();

            await db.delete({
                ...dbArgs,
                query: {
                    PK: `T#${tenantId}`,
                    SK: `G#${slug}`
                }
            });

            return true;
        }
    };
};
