import { ContextPlugin } from "@webiny/handler";
import { createAdminUsers } from "./createAdminUsers";
import { AdminUsersContext, AdminUsersStorageOperations } from "./types";
import base from "./graphql/base.gql";
import install from "./graphql/install.gql";
import user from "./graphql/user.gql";
import { subscribeToEvents } from "~/subscribeToEvents";
import { applyMultiTenancyPlugins } from "~/enterprise/multiTenancy";

export interface Config {
    storageOperations: AdminUsersStorageOperations;
}

export default ({ storageOperations }: Config) => {
    return [
        new ContextPlugin<AdminUsersContext>(async context => {
            const { security, tenancy } = context;

            const getTenant = () => {
                const tenant = tenancy.getCurrentTenant();
                return tenant ? tenant.id : undefined;
            };

            const getPermission = (name: string) => security.getPermission(name);
            const getIdentity = () => security.getIdentity();

            context.adminUsers = await createAdminUsers({
                storageOperations,
                getTenant,
                getPermission,
                getIdentity
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
