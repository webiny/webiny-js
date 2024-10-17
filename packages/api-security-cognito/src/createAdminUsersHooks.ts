import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { PermissionsTenantLink, PermissionsTenantLinkTeam } from "@webiny/api-security/types";

/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";

export const createAdminUsersHooks = () => {
    return new ContextPlugin<AdminUsersContext>(async context => {
        const { security, tenancy, adminUsers } = context;

        const getTenant = () => {
            const tenant = tenancy.getCurrentTenant();
            return tenant ? tenant.id : undefined;
        };

        // After a new user is created, link him to a tenant via the assigned group.
        adminUsers.onUserAfterCreate.subscribe(async ({ user }) => {
            const tenant = getTenant();

            if (!tenant) {
                return;
            }

            const data: PermissionsTenantLink["data"] = { groups: [], teams: [] };

            const userTeams = user.teams || [];
            if (userTeams.length > 0) {
                const teams = await security.listTeams({ where: { id_in: userTeams } });
                for (const team of teams) {
                    const teamGroups = await security.listGroups({ where: { id_in: team.groups } });
                    data.teams.push({
                        id: team.id,
                        groups: teamGroups.map(group => ({
                            id: group.id,
                            permissions: group.permissions
                        }))
                    });
                }
            }

            const userGroups = user.groups || [];

            if (userGroups.length > 0) {
                const groups = await security.listGroups({ where: { id_in: userGroups } });
                for (const group of groups) {
                    data.groups.push({ id: group.id, permissions: group.permissions });
                }
            }

            await security.createTenantLinks([
                {
                    tenant,
                    // IMPORTANT!
                    // Use the `id` that was assigned in the user creation process.
                    // `syncWithCognito` will assign the `sub` value to the user id, so that the identity id matches the user id.
                    identity: user.id,

                    // With 5.37.0, these tenant links not only contain group-related permissions,
                    // but teams-related too. The `type=group` hasn't been changed, just so the
                    // data migrations are easier.
                    type: "group",
                    data
                }
            ]);
        });

        // On user update, if the group was changed, update the tenant link.
        adminUsers.onUserAfterUpdate.subscribe(async ({ updatedUser, originalUser }) => {
            const tenant = getTenant();

            if (!tenant) {
                return;
            }

            // If group/team hasn't changed, we don't need to do anything.
            const groupsChanged = !deepEqual(updatedUser.groups, originalUser.groups);
            const teamsChanged = !deepEqual(updatedUser.teams, originalUser.teams);
            if (!groupsChanged && !teamsChanged) {
                return;
            }

            const data: PermissionsTenantLink["data"] = { groups: [], teams: [] };

            const updatedUserTeams = updatedUser.teams || [];
            if (updatedUserTeams.length > 0) {
                data.teams = await security
                    .listTeams({ where: { id_in: updatedUserTeams } })
                    .then(async teams => {
                        if (!teams.length) {
                            return [];
                        }

                        const tenantLinkTeams: PermissionsTenantLinkTeam[] = [];
                        for (const team of teams) {
                            const teamGroups = await security.listGroups({
                                where: { id_in: team.groups }
                            });
                            tenantLinkTeams.push({
                                id: team.id,
                                groups: teamGroups.map(group => {
                                    return { id: group.id, permissions: group.permissions };
                                })
                            });
                        }

                        return tenantLinkTeams;
                    });
            }

            const updatedUserGroups = updatedUser.groups || [];
            if (updatedUserGroups.length > 0) {
                data.groups = await security
                    .listGroups({ where: { id_in: updatedUserGroups } })
                    .then(groups => {
                        if (!groups.length) {
                            return [];
                        }

                        return groups.map(group => {
                            return { id: group.id, permissions: group.permissions };
                        });
                    });
            }

            await security.updateTenantLinks([
                {
                    tenant,
                    identity: updatedUser.id,

                    // With 5.37.0, these tenant links not only contain group-related permissions,
                    // but teams-related too. The `type=group` hasn't been changed, just so the
                    // data migrations are easier.
                    type: "group",
                    data
                }
            ]);
        });

        // On user delete, delete its tenant link.
        adminUsers.onUserAfterDelete.subscribe(async ({ user }) => {
            const tenant = getTenant();

            if (!tenant) {
                return;
            }

            await security.deleteTenantLinks([
                {
                    tenant,
                    identity: user.id
                }
            ]);
        });

        // Before install, load `full-access` group and assign it to the new user.
        adminUsers.onSystemBeforeInstall.subscribe(async ({ user }) => {
            const group = await security.getGroup({ where: { slug: "full-access" } });
            user.groups = [group.id];
        });

        adminUsers.onInstall.subscribe(async ({ user }) => {
            const userWithDisplayName = {
                ...user,
                displayName: user.firstName + " " + user.lastName
            };

            await adminUsers.createUser(userWithDisplayName);
        });
    });
};
