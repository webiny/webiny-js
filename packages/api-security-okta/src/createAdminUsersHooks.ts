import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "@webiny/api-admin-users/types";

export const createAdminUsersHooks = () => {
    return new ContextPlugin<AdminUsersContext>(async context => {
        const { security, adminUsers } = context;

        security.onLogin.subscribe(async ({ identity }) => {
            const user = await adminUsers.getUser({ where: { id: identity.id } });

            const id = identity.id;
            const email = identity.email || `id:${id}`;
            const displayName = identity.displayName || "Missing display name";

            if (user) {
                await adminUsers.updateUser(identity.id, { displayName, email });
                return;
            }

            await adminUsers.createUser({ id, email, displayName });
        });
    });
};
