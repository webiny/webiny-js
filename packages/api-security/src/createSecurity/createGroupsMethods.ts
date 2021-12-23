import mdbid from "mdbid";
import deepEqual from "deep-equal";
import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { GetGroupParams, Group, GroupInput, GroupTenantLink, Security } from "~/types";
import NotAuthorizedError from "../NotAuthorizedError";
import { SecurityConfig } from "~/types";

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

async function checkPermission(security: Security) {
    const permission = await security.getPermission("security.group");

    if (!permission) {
        throw new NotAuthorizedError();
    }
}

async function updateTenantLinks(security: Security, tenant: string, group: Group) {
    const links = await security.listTenantLinksByType<GroupTenantLink>({ tenant, type: "group" });

    if (!links.length) {
        return;
    }

    await security.updateTenantLinks(
        links
            .filter(link => link.data.group === group.id)
            .map(link => ({
                ...link,
                data: { group: group.id, permissions: group.permissions }
            }))
    );
}

export const createGroupsMethods = ({ getTenant, storageOperations }: SecurityConfig) => {
    return {
        async getGroup(this: Security, { where }: GetGroupParams): Promise<Group> {
            await checkPermission(this);

            let group: Group = null;
            try {
                group = await storageOperations.getGroup({
                    where: { ...where, tenant: where.tenant || getTenant() }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get group.",
                    ex.code || "GET_GROUP_ERROR",
                    where
                );
            }
            if (!group) {
                throw new NotFoundError(`Unable to find group : ${JSON.stringify(where)}`);
            }
            return group;
        },

        async listGroups(this: Security) {
            await checkPermission(this);
            try {
                return await storageOperations.listGroups({
                    where: {
                        tenant: getTenant()
                    },
                    sort: ["createdOn_ASC"]
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list API keys.",
                    ex.code || "LIST_API_KEY_ERROR"
                );
            }
        },

        async createGroup(this: Security, input: GroupInput) {
            await checkPermission(this);

            const identity = this.getIdentity();
            const currentTenant = getTenant();

            await new CreateDataModel().populate({ ...input, tenant: currentTenant }).validate();

            const existing = await storageOperations.getGroup({
                where: {
                    tenant: currentTenant,
                    slug: input.slug
                }
            });

            if (existing) {
                throw new WebinyError(
                    `Group with slug "${input.slug}" already exists.`,
                    "GROUP_EXISTS"
                );
            }

            const group: Group = {
                id: mdbid(),
                tenant: currentTenant,
                system: false,
                ...input,
                webinyVersion: process.env.WEBINY_VERSION,
                createdOn: new Date().toISOString(),
                createdBy: identity
                    ? {
                          id: identity.id,
                          displayName: identity.displayName,
                          type: identity.type
                      }
                    : null
            };

            try {
                return await storageOperations.createGroup({ group });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create group.",
                    ex.code || "CREATE_GROUP_ERROR",
                    {
                        group
                    }
                );
            }
        },

        async updateGroup(this: Security, id: string, input: Record<string, any>) {
            await checkPermission(this);

            const model = await new UpdateDataModel().populate(input);
            await model.validate();

            const original = await storageOperations.getGroup({
                where: { tenant: getTenant(), id }
            });
            if (!original) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }

            const data = await model.toJSON({ onlyDirty: true });

            const permissionsChanged = !deepEqual(data.permissions, original.permissions);

            const group: Group = {
                ...original,
                ...data
            };
            try {
                const result = await storageOperations.updateGroup({ original, group });
                if (permissionsChanged) {
                    await updateTenantLinks(this, getTenant(), result);
                }
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update group.",
                    ex.code || "UPDATE_GROUP_ERROR",
                    {
                        group
                    }
                );
            }
        },

        async deleteGroup(this: Security, id: string) {
            await checkPermission(this);

            const group = await storageOperations.getGroup({ where: { tenant: getTenant(), id } });
            if (!group) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }
            try {
                await storageOperations.deleteGroup({ group });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete group.",
                    ex.code || "DELETE_GROUP_ERROR",
                    {
                        group
                    }
                );
            }
        }
    };
};
