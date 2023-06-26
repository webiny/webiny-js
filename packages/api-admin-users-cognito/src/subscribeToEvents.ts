import { PermissionsTenantLink, SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { AdminUsersContext } from "~/types";
import { migration } from "~/migration";

type Context = SecurityContext & TenancyContext & AdminUsersContext;

export const subscribeToEvents = (context: Context): void => {
    const { security, tenancy, adminUsers } = context;

    const getTenant = () => {
        const tenant = tenancy.getCurrentTenant();
        return tenant ? tenant.id : undefined;
    };

    // After a new user is created, link him to a tenant via the assigned group.
    adminUsers.onUserAfterCreate.subscribe(async ({ user }) => {
        /**
         * TODO @ts-refactor @pavel
         * Are we continuing if there is no tenant?
         */
        const tenant = getTenant();

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
                /**
                 * Check few lines up.
                 */
                // @ts-ignore
                tenant,
                // IMPORTANT!
                // Use the `id` that was assigned in the user creation process.
                // `syncWithCognito` will assign the `sub` value to the user id, so that the identity id matches the user id.
                identity: user.id,
                type: "permissions",
                data
            }
        ]);
    });

    // On user update, if the group was changed, update the tenant link.
    adminUsers.onUserAfterUpdate.subscribe(async ({ updatedUser, originalUser }) => {
        const tenant = getTenant();

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
                /**
                 * TODO @ts-refactor @pavel
                 * Same as in afterCreate method
                 */
                // @ts-ignore
                tenant,
                identity: updatedUser.id,
                type: "permissions",
                data
            }
        ]);
    });

    // On user delete, delete its tenant link.
    adminUsers.onUserAfterDelete.subscribe(async ({ user }) => {
        /**
         * TODO @ts-refactor @pavel
         * Are we continuing if there is no tenant?
         */
        const tenant = getTenant();

        await security.deleteTenantLinks([
            {
                /**
                 * TODO @ts-refactor @pavel
                 * Same as in afterCreate method
                 */
                // @ts-ignore
                tenant,
                identity: user.id,
                type: "permissions"
            }
        ]);
    });

    // Before install, load `full-access` group and assign it to the new user.
    adminUsers.onSystemBeforeInstall.subscribe(async ({ user }) => {
        const group = await security.getGroup({ where: { slug: "full-access" } });
        user.group = group.id;
    });

    adminUsers.onInstall.subscribe(async ({ user }) => {
        await adminUsers.createUser(user);
    });

    // Setup migration script
    migration(context);
};
