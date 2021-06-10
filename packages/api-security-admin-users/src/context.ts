import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { Tenant } from "@webiny/api-tenancy/types";
import { Users } from "./crud/users.crud";
import groupCrud from "./crud/groups.crud";
import apiKeyCrud from "./crud/apiKey.crud";
import systemCrud from "./crud/system.crud";
import { AdminUsersContext } from "./types";

export default () => {
    return new ContextPlugin<AdminUsersContext>(async context => {
        if (!context.security) {
            // @ts-ignore
            context.security = {};
        }

        // @ts-ignore
        context.security.getTenant = () => {
            console.log(
                `[DEPRECATION] "context.security.getTenant()" is now deprecated! Use "context.tenancy.getCurrentTenant()" instead.`
            );
            return context.tenancy.getCurrentTenant();
        };

        // @ts-ignore
        context.security.setTenant = (tenant: Tenant) => {
            console.log(
                `[DEPRECATION] "context.security.setTenant()" is now deprecated! Use "context.tenancy.setCurrentTenant()" instead.`
            );
            context.tenancy.setCurrentTenant(tenant);
        };

        context.security.users = new Users(context);
        context.security.groups = groupCrud(context);
        context.security.apiKeys = apiKeyCrud(context);
        context.security.system = systemCrud(context);
    });
};
