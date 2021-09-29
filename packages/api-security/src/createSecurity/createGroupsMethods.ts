import mdbid from "mdbid";
import deepEqual from "deep-equal";
import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { CrudOptions, GetGroupWhere, Group, GroupTenantLink, Security } from "~/types";
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

async function checkPermission(security: Security, options?: CrudOptions) {
    if (options && options.auth === false) {
        return;
    }
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
        links.map(link => ({
            ...link,
            data: { permissions: group.permissions }
        }))
    );
}

export const createGroupsMethods = ({
    getTenant,
    storageOperations
}: SecurityConfig) => {
    return {
        async getGroup(
            this: Security,
            where: GetGroupWhere,
            options: CrudOptions = {}
        ): Promise<Group> {
            await checkPermission(this, options);

            let group: Group = null;
            try {
                group = await storageOperations.getGroup({ tenant: getTenant(), where });
            } catch (ex) {
                throw new Error(
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

        async listGroups(this: Security, options: CrudOptions = {}) {
            await checkPermission(this, options);
            try {
                return await storageOperations.listGroups({
                    tenant: getTenant(),
                    sort: ["createdOn_ASC"]
                });
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not list API keys.",
                    ex.code || "LIST_API_KEY_ERROR"
                );
            }
        },

        async createGroup(this: Security, input, options = {}) {
            await checkPermission(this, options);

            const identity = this.getIdentity();
            const currentTenant = getTenant();

            await new CreateDataModel().populate({ ...input, tenant: currentTenant }).validate();

            const existing = await storageOperations.getGroup({
                tenant: currentTenant,
                where: {
                    slug: input.slug
                }
            });

            if (existing) {
                throw new Error(`Group with slug "${input.slug}" already exists.`, "GROUP_EXISTS");
            }

            const group: Group = {
                id: mdbid(),
                tenant: currentTenant,
                system: false,
                ...input,
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
                throw new Error(
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
                tenant: getTenant(),
                where: { id }
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
                throw new Error(
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

            const group = await storageOperations.getGroup({ tenant: getTenant(), where: { id } });
            if (!group) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }
            try {
                await storageOperations.deleteGroup({ group });
            } catch (ex) {
                throw new Error(
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
