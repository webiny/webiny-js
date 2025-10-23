/**
 * Package deep-equal does not have types.
 */
import deepEqual from "deep-equal";
import { createTopic } from "@webiny/pubsub";
import { createZodError, mdbid } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import type {
    GetGroupParams,
    Group,
    GroupInput,
    ListGroupsParams,
    PermissionsTenantLink,
    Security,
    SecurityConfig
} from "~/types.js";
import NotAuthorizedError from "../NotAuthorizedError.js";
import {
    type ListGroupsFromPluginsParams,
    listGroupsFromProvider as baseListGroupsFromPlugins
} from "./groupsTeamsPlugins/listGroupsFromProvider.js";
import {
    type GetGroupFromPluginsParams,
    getGroupFromProvider as baseGetGroupFromPlugins
} from "./groupsTeamsPlugins/getGroupFromProvider.js";
import zod from "zod";

const createGroupValidation = zod.object({
    name: zod.string().min(3),
    slug: zod.string().min(3),
    description: zod.string().max(500).optional().default(""),
    permissions: zod.array(
        zod
            .object({
                name: zod.string()
            })
            .passthrough()
    )
});

const updateGroupValidation = zod.object({
    name: zod.string().min(3).optional(),
    description: zod.string().max(500).optional(),
    permissions: zod
        .array(
            zod
                .object({
                    name: zod.string()
                })
                .passthrough()
        )
        .optional()
});

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
    storageOperations,
    groupsProvider
}: SecurityConfig) => {
    const getTenant = () => {
        const tenant = initialGetTenant();
        if (!tenant) {
            throw new WebinyError("Missing tenant.");
        }
        return tenant;
    };

    const listGroupsFromPlugins = (
        params: Pick<ListGroupsFromPluginsParams, "where">
    ): Promise<Group[]> => {
        return baseListGroupsFromPlugins({
            ...params,
            groupsProvider
        });
    };

    const getGroupFromPlugins = (
        params: Pick<GetGroupFromPluginsParams, "where">
    ): Promise<Group> => {
        return baseGetGroupFromPlugins({
            ...params,
            groupsProvider
        });
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
                const whereWithTenant = { ...where, tenant: where.tenant || getTenant() };
                const groupFromPlugins = await getGroupFromPlugins({ where: whereWithTenant });

                if (groupFromPlugins) {
                    group = groupFromPlugins;
                } else {
                    group = await storageOperations.getGroup({ where: whereWithTenant });
                }
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
                const whereWithTenant = { ...where, tenant: getTenant() };

                const groupsFromDatabase = await storageOperations.listGroups({
                    where: whereWithTenant,
                    sort: ["createdOn_ASC"]
                });

                const groupsFromPlugins = await listGroupsFromPlugins({ where: whereWithTenant });

                // We don't have to do any extra sorting because, as we can see above, `createdOn_ASC` is
                // hardcoded, and groups coming from plugins don't have `createdOn`, meaning they should
                // always be at the top of the list.
                return [...groupsFromPlugins, ...groupsFromDatabase];
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list security groups.",
                    ex.code || "LIST_SECURITY_GROUP_ERROR"
                );
            }
        },

        async createGroup(this: Security, input: GroupInput): Promise<Group> {
            await checkPermission(this);

            const identity = this.getIdentity();
            const currentTenant = getTenant();

            const validation = createGroupValidation.safeParse(input);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

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
                ...validation.data,
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

            const validation = updateGroupValidation.safeParse(input);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

            const original = await this.getGroup({
                where: { tenant: getTenant(), id }
            });
            if (!original) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }

            // We can't proceed with the update if one of the following is true:
            // 1. The group is system group.
            // 2. The group is created via a plugin.
            if (original.system) {
                throw new WebinyError(
                    `Cannot update system groups.`,
                    "CANNOT_UPDATE_SYSTEM_GROUPS"
                );
            }

            if (original.plugin) {
                throw new WebinyError(
                    `Cannot update groups created via plugins.`,
                    "CANNOT_UPDATE_PLUGIN_GROUPS"
                );
            }

            const group: Group = {
                ...original
            };
            for (const key in group) {
                // @ts-expect-error
                const value = validation.data[key];
                if (value === undefined) {
                    continue;
                }
                // @ts-expect-error
                group[key] = value;
            }

            const permissionsChanged = !deepEqual(group.permissions, original.permissions);

            try {
                await this.onGroupBeforeUpdate.publish({ original, group });
                const result = await storageOperations.updateGroup({ group });
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

            const group = await this.getGroup({ where: { tenant: getTenant(), id } });
            if (!group) {
                throw new NotFoundError(`Group "${id}" was not found!`);
            }

            // We can't proceed with the deletion if one of the following is true:
            // 1. The group is system group.
            // 2. The group is created via a plugin.
            // 3. The group is being used by one or more tenant links.
            // 4. The group is being used by one or more teams.
            if (group.system) {
                throw new WebinyError(
                    `Cannot delete system groups.`,
                    "CANNOT_DELETE_SYSTEM_GROUPS"
                );
            }

            if (group.plugin) {
                throw new WebinyError(
                    `Cannot delete groups created via plugins.`,
                    "CANNOT_DELETE_PLUGIN_GROUPS"
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
