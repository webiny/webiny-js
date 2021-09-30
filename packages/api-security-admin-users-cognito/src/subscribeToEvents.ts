import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { AdminUsersContext } from "~/types";

type Context = SecurityContext & TenancyContext & AdminUsersContext;

export const subscribeToEvents = ({ security, tenancy, adminUsers }: Context) => {
    const getTenant = () => {
        const tenant = tenancy.getCurrentTenant();
        return tenant ? tenant.id : undefined;
    };

    // After a new user is created, link him to a tenant via the assigned group.
    adminUsers.onUserAfterCreate.subscribe(async ({ user }) => {
        const group = await security.getGroup({ id: user.group });
        await security.createTenantLinks([
            {
                tenant: getTenant(),
                // IMPORTANT!
                // Use the `id` that was assigned in the user creation process.
                // `syncWithCognito` will assign the `sub` value to the user id, so that the identity id matches the user id.
                identity: user.id,
                type: "group",
                data: {
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

        const group = await security.getGroup({ id: updatedUser.group });
        await security.updateTenantLinks([
            {
                tenant: getTenant(),
                identity: updatedUser.id,
                type: "group",
                data: { permissions: group.permissions }
            }
        ]);
    });

    // Before install, load `full-access` group and assign it to the new user.
    adminUsers.onBeforeInstall.subscribe(async ({ user }) => {
        const group = await security.getGroup({ slug: "full-access" });
        user.group = group.id;
    });
};
