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
import { createTopic } from "@webiny/pubsub";
import { validation } from "@webiny/validation";
import { mdbid } from "@webiny/utils";
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
        type: "group"
    });

    if (!links.length) {
        return;
    }

    await security.updateTenantLinks(
        links
            .filter(link => {
                const linkGroups = link.data?.groups;
                const linkHasGroups = Array.isArray(linkGroups) && linkGroups.length;
                if (linkHasGroups) {
                    const linkHasGroup = linkGroups.some(item => item.id === updatedGroup.id);
                    if (linkHasGroup) {
                        return true;
                    }
                }

                const linkTeams = link.data?.teams;
                const linkHasTeams = Array.isArray(linkTeams) && linkTeams.length;
                if (linkHasTeams) {
                    const linkHasTeamWithGroup = linkTeams.some(team =>
                        team.groups.some(teamGroup => teamGroup.id === updatedGroup.id)
                    );

                    if (linkHasTeamWithGroup) {
                        return true;
                    }
                }

                return false;
            })
            .map(link => {
                const data = { ...link.data };

                const linkGroups = link.data?.groups;
                const linkHasGroups = Array.isArray(linkGroups) && linkGroups.length;
                if (linkHasGroups) {
                    const linkHasGroup = linkGroups.some(item => item.id === updatedGroup.id);
                    if (linkHasGroup) {
                        data.groups = linkGroups.map(item => {
                            if (item.id !== updatedGroup.id) {
                                return item;
                            }

                            return {
                                id: updatedGroup.id,
                                permissions: updatedGroup.permissions
                            };
                        });
                    }
                }

                const linkTeams = link.data?.teams;
                const linkHasTeams = Array.isArray(linkTeams) && linkTeams.length;
                if (linkHasTeams) {
                    const linkHasTeamWithGroup = linkTeams.some(team =>
                        team.groups.some(teamGroup => teamGroup.id === updatedGroup.id)
                    );

                    if (linkHasTeamWithGroup) {
                        data.teams = linkTeams.map(team => {
                            const teamGroups = team.groups.map(teamGroup => {
                                if (teamGroup.id !== updatedGroup.id) {
                                    return teamGroup;
                                }

                                return {
                                    id: updatedGroup.id,
                                    permissions: updatedGroup.permissions
                                };
                            });

                            return {
                                ...team,
                                groups: teamGroups
                            };
                        });
                    }
                }

                return { ...link, data };
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
        onGroupBeforeCreate: createTopic("security.onGroupBeforeCreate"),
        onGroupAfterCreate: createTopic("security.onGroupAfterCreate"),
        onGroupBeforeBatchCreate: createTopic("security.onGroupBeforeBatchCreate"),
        onGroupAfterBatchCreate: createTopic("security.onGroupAfterBatchCreate"),
        onGroupBeforeUpdate: createTopic("security.onGroupBeforeUpdate"),
        onGroupAfterUpdate: createTopic("security.onGroupAfterUpdate"),
        onGroupBeforeDelete: createTopic("security.onGroupBeforeDelete"),
        onGroupAfterDelete: createTopic("security.onGroupAfterDelete"),

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
                await this.onGroupBeforeCreate.publish({ group });
                const result = await storageOperations.createGroup({ group });
                await this.onGroupAfterCreate.publish({ group: result });

                return result;
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
                await this.onGroupBeforeUpdate.publish({ original, group });
                const result = await storageOperations.updateGroup({ original, group });
                if (permissionsChanged) {
                    await updateTenantLinks(this, getTenant(), result);
                }
                await this.onGroupAfterUpdate.publish({ original, group: result });

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

                    // With 5.37.0, these tenant links not only contain group-related permissions,
                    // but teams-related too. The `type=group` hasn't been changed, just so the
                    // data migrations are easier.
                    type: "group"
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
                await this.onGroupBeforeDelete.publish({ group });
                await storageOperations.deleteGroup({ group });
                await this.onGroupAfterDelete.publish({ group });
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
