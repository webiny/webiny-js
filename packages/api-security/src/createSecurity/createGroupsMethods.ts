/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package deep-equal does not have types.
 */
// @ts-ignore
import deepEqual from "deep-equal";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    GetGroupParams,
    Group,
    GroupInput,
    PermissionsTenantLink,
    ListGroupsParams,
    Security
} from "~/types";
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

async function checkPermission(security: Security): Promise<void> {
    const permission = await security.getPermission("security.group");

    if (!permission) {
        throw new NotAuthorizedError();
    }
}

async function updateTenantLinks(
    security: Security,
    tenant: string,
    updatedGroup: Group
): Promise<void> {
    const links = await security.listTenantLinksByType<PermissionsTenantLink>({
        tenant,
        type: "permissions"
    });

    if (!links.length) {
        return;
    }

    await security.updateTenantLinks(
        links
            .filter(link => {
                const linkGroups = link.data?.groups;
                if (!Array.isArray(linkGroups) || !linkGroups.length) {
                    return false;
                }

                return linkGroups.some(item => item.id === updatedGroup.id);
            })
            .map(link => {
                const linkGroups = link.data!.groups;

                return {
                    ...link,
                    data: {
                        ...link.data,
                        groups: linkGroups.map(linkGroup => {
                            if (linkGroup.id !== updatedGroup.id) {
                                return linkGroup;
                            }

                            return {
                                id: updatedGroup.id,
                                permissions: updatedGroup.permissions
                            };
                        })
                    }
                };
            })
    );
}

export const createGroupsMethods = ({
    getTenant: initialGetTenant,
    storageOperations
}: SecurityConfig) => {
    const getTenant = () => {
        const tenant = initialGetTenant();
        if (!tenant) {
            throw new WebinyError("Missing tenant.");
        }
        return tenant;
    };
    return {
        async getGroup(this: Security, { where }: GetGroupParams): Promise<Group> {
            await checkPermission(this);

            let group: Group | null = null;
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

        async listGroups(this: Security, { where }: ListGroupsParams = {}) {
            await checkPermission(this);
            try {
                return await storageOperations.listGroups({
                    where: {
                        ...where,
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

        async createGroup(this: Security, input: GroupInput): Promise<Group> {
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
                ...input,
                system: input.system === true,
                webinyVersion: process.env.WEBINY_VERSION as string,
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

        async updateGroup(this: Security, id: string, input: Record<string, any>): Promise<Group> {
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

        async deleteGroup(this: Security, id: string): Promise<void> {
            await checkPermission(this);

            const group = await storageOperations.getGroup({ where: { tenant: getTenant(), id } });
            if (!group) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }

            // We can't proceed with the deletion if one of the following is true:
            // 1. The group is system group.
            // 2. The group is being used by one or more tenant links.
            // 3. The group is being used by one or more teams.

            // 1. Is system group?
            if (group.system) {
                throw new WebinyError(
                    `Cannot delete system groups.`,
                    "CANNOT_DELETE_SYSTEM_GROUPS"
                );
            }

            // 2. Is being used by one or more tenant links?
            const usagesInTenantLinks = await storageOperations
                .listTenantLinksByType({
                    tenant: getTenant(),
                    type: "permissions"
                })
                .then(links =>
                    links.filter(link => {
                        const linkGroups = link.data?.groups;
                        if (Array.isArray(linkGroups) && linkGroups.length > 0) {
                            return linkGroups.some(linkGroup => linkGroup.id === id);
                        }
                        return false;
                    })
                );

            if (usagesInTenantLinks.length > 0) {
                let foundUsages = "(found 1 usage)";
                if (usagesInTenantLinks.length > 1) {
                    foundUsages = `(found ${usagesInTenantLinks.length} usages)`;
                }

                throw new WebinyError(
                    `Cannot delete "${group.name}" group because it is currently being used in tenant links ${foundUsages}.`,
                    "CANNOT_DELETE_GROUP_USED_IN_TENANT_LINKS",
                    { tenantLinksCount: usagesInTenantLinks.length }
                );
            }

            // 3. Is being used by one or more teams?
            const usagesInTeams = await storageOperations
                .listTeams({ where: { tenant: getTenant() } })
                .then(teams => {
                    return teams.filter(team => {
                        const teamGroupsIds = team.groups;
                        if (Array.isArray(teamGroupsIds) && teamGroupsIds.length > 0) {
                            return teamGroupsIds.some(teamGroupId => teamGroupId === id);
                        }
                        return false;
                    });
                });

            if (usagesInTeams.length > 0) {
                let foundUsages = "(found 1 usage)";
                if (usagesInTeams.length > 1) {
                    foundUsages = `(found ${usagesInTeams.length} usages)`;
                }

                throw new WebinyError(
                    `Cannot delete "${group.name}" group because it is currently being used with one or more teams ${foundUsages}.`,
                    "GROUP_EXISTS",
                    {
                        teamsCount: usagesInTeams.length,
                        teams: usagesInTeams.map(team => ({ id: team.id, name: team.name }))
                    }
                );
            }

            // Delete the group if none of the above conditions are met.
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
