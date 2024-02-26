import { ContextPlugin } from "@webiny/api";
import { createAdminUsers } from "./createAdminUsers";
import { AdminUsersContext, AdminUsersStorageOperations } from "./types";
import baseGqlPlugins from "./graphql/base.gql";
import adminUsersGqlPlugins from "./graphql/user.gql";
import installGqlPlugins from "./graphql/install.gql";
import { applyMultiTenancyPlugins } from "~/multiTenancy";
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
                // @ts-expect-error
                return tenant ? tenant.id : undefined;
            };

            const getPermission = async (name: string): Promise<SecurityPermission | null> => {
                return security.getPermission(name);
            };
            const getIdentity = () => security.getIdentity();

            context.adminUsers = createAdminUsers({
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

            if (context.tenancy.isMultiTenant()) {
                applyMultiTenancyPlugins(context);
            }

            const teams = context.wcp.canUseTeams();
            context.plugins.register(adminUsersGqlPlugins({ teams }));
        }),
        installGqlPlugins,
        baseGqlPlugins
    ];
};
