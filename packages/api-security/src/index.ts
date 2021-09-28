import { PluginCollection } from "@webiny/plugins/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext } from "@webiny/api-tenancy/types";
export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse";
export { default as NotAuthorizedError } from "./NotAuthorizedError";
import { SecurityContext, SecurityStorageOperations } from "./types";
import graphqlPlugins from "./graphql";
import { createSecurity } from "~/createSecurity";
import { attachGroupInstaller } from "~/installation/groups";

export interface SecurityConfig {
    storageOperations: SecurityStorageOperations;
}

export default ({ storageOperations }: SecurityConfig): PluginCollection => [
    new ContextPlugin<SecurityContext & TenancyContext>(async context => {
        const getTenant = () => context.tenancy.getCurrentTenant();

        context.security = await createSecurity({
            getTenant: () => getTenant().id,
            storageOperations
        });
        
        attachGroupInstaller(context.security);

        // TODO: register all legacy authentication/authorization plugins
    }),
    graphqlPlugins
];
