import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { PermissionsTenantLink } from "@webiny/api-security/types";

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

            if (user.team) {
                const team = await security.getTeam({ where: { id: user.team } });
                const teamGroups = await security.listGroups({ where: { id_in: team.groups } });
                data.teams = [
                    {
                        id: team.id,
                        groups: teamGroups.map(group => ({
                            id: group.id,
                            permissions: group.permissions
                        }))
                    }
                ];
            }

            if (user.group) {
                const group = await security.getGroup({ where: { id: user.group } });
                data.groups = [{ id: group.id, permissions: group.permissions }];
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
            const groupChanged = updatedUser.group !== originalUser.group;
            const teamChanged = updatedUser.team !== originalUser.team;
            if (!groupChanged && !teamChanged) {
                return;
            }

            const data: PermissionsTenantLink["data"] = { groups: [], teams: [] };

            if (updatedUser.team) {
                data.teams = await security
                    .getTeam({ where: { id: updatedUser.team } })
                    .then(async team => {
                        if (!team) {
                            return [];
                        }

                        const teamGroups = await security.listGroups({
                            where: { id_in: team.groups }
                        });

                        return [
                            {
                                id: team.id,
                                groups: teamGroups.map(group => {
                                    return { id: group.id, permissions: group.permissions };
                                })
                            }
                        ];
                    });
            }

            if (updatedUser.group) {
                data.groups = await security
                    .getGroup({ where: { id: updatedUser.group } })
                    .then(group => {
                        if (!group) {
                            return [];
                        }
                        return [{ id: group.id, permissions: group.permissions }];
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
            user.group = group.id;
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
