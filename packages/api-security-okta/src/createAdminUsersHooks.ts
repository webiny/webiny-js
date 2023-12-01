import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "@webiny/api-admin-users/types";

export const createAdminUsersHooks = () => {
    return new ContextPlugin<AdminUsersContext>(async context => {
        const { security, adminUsers } = context;

        security.onLogin.subscribe(async ({ identity }) => {
            await security.withoutAuthorization(async () => {
                const user = await adminUsers.getUser({ where: { id: identity.id } });

                const id = identity.id;
                const email = identity.email || `id:${id}`;
                const displayName = identity.displayName || "Missing display name";

                let groupId: string | null = null;
                let teamId: string | null = null;

                if (identity.group) {
                    const group = await security.getGroup({ where: { slug: identity.group } });
                    if (group) {
                        groupId = group.id;
                    }
                }

                if (identity.team) {
                    const team = await security.getTeam({ where: { slug: identity.team } });
                    if (team) {
                        teamId = team.id;
                    }
                }

                const data = {
                    displayName,
                    email,
                    group: groupId,
                    team: teamId
                };

                if (user) {
                    await adminUsers.updateUser(identity.id, data);
                    return;
                }

                await adminUsers.createUser({ id, ...data });
            });
        });
    });
};
