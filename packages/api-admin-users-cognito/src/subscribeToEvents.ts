import { SecurityContext } from "@webiny/api-security/types";
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

        const group = await security.getGroup({ where: { id: user.group } });
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
                type: "group",
                data: {
                    group: group.id,
                    permissions: group.permissions
                }
            }
        ]);
    });

    // On user update, if the group was changed, update the tenant link.
    adminUsers.onUserAfterUpdate.subscribe(async ({ updatedUser, originalUser }) => {
        if (updatedUser.group === originalUser.group) {
            return;
        }

        const tenant = getTenant();

        const group = await security.getGroup({ where: { id: updatedUser.group } });
        await security.updateTenantLinks([
            {
                /**
                 * TODO @ts-refactor @pavel
                 * Same as in afterCreate method
                 */
                // @ts-ignore
                tenant,
                identity: updatedUser.id,
                type: "group",
                data: { group: group.id, permissions: group.permissions }
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
