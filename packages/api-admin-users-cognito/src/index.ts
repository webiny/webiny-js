import { ContextPlugin } from "@webiny/handler";
import { createAdminUsers } from "./createAdminUsers";
import { AdminUsersContext, AdminUsersStorageOperations } from "./types";
import base from "./graphql/base.gql";
import install from "./graphql/install.gql";
import user from "./graphql/user.gql";
import { subscribeToEvents } from "~/subscribeToEvents";
import { applyMultiTenancyPlugins } from "~/enterprise/multiTenancy";
import { SecurityPermission } from "@webiny/api-security/types";

export interface Config {
    storageOperations: AdminUsersStorageOperations;
}

export default ({ storageOperations }: Config) => {
    return [
        new ContextPlugin<AdminUsersContext>(async context => {
            const { security, tenancy } = context;

            const getTenant = (): string => {
                const tenant = tenancy.getCurrentTenant();
                /**
                 * TODO @ts-refactor @pavel
                 * When creating users, is it possible there is no tenant defined?
                 */
                // @ts-ignore
                return tenant ? tenant.id : undefined;
            };

            const getPermission = async (name: string): Promise<SecurityPermission | null> => {
                return security.getPermission(name);
            };
            const getIdentity = () => security.getIdentity();

            context.adminUsers = await createAdminUsers({
                storageOperations,
                getTenant,
                getPermission,
                getIdentity,
                incrementWcpSeats: async () => {
                    if (!context.wcp) {
                        return;
                    }

                    await context.wcp.incrementSeats();
                },
                decrementWcpSeats: async () => {
                    if (!context.wcp) {
                        return;
                    }

                    await context.wcp.decrementSeats();
                }
            });

            subscribeToEvents(context);

            if (context.tenancy.isMultiTenant()) {
                applyMultiTenancyPlugins(context);
            }
        }),
        base,
        install,
        user
    ];
};
