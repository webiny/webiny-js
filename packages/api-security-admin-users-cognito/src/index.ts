import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { createAdminUsers } from "./createAdminUsers";
import { AdminUsersContext, AdminUsersStorageOperations } from "./types";
import base from "./graphql/base.gql";
import install from "./graphql/install.gql";
import user from "./graphql/user.gql";
import { subscribeToEvents } from "~/subscribeToEvents";

type Context = SecurityContext & TenancyContext & AdminUsersContext;

export interface Config {
    storageOperations: AdminUsersStorageOperations;
}

export default ({ storageOperations }: Config) => {
    return [
        new ContextPlugin<Context>(async context => {
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
        }),
        base,
        install,
        user
    ];
};
