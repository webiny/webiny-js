import { Context as HandlerContext } from "@webiny/handler/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
type Context = HandlerContext<TenancyContext, SecurityContext>;

export interface Config {
    identityType?: string;
}

export default ({ identityType }: Config) => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async token => {
            if (typeof token !== "string" || !token.startsWith("a")) {
                return;
            }

            const tenant = context.tenancy.getCurrentTenant();

            const apiKey = await context.security
                .getStorageOperations()
                .getApiKeyByToken({ tenant: tenant.id, token });

            if (apiKey) {
                return {
                    id: apiKey.id,
                    displayName: apiKey.name,
                    type: identityType || "api-key",
                    // Add permissions directly to the identity so we don't have to load them
                    // again when authorization kicks in.
                    permissions: apiKey.permissions
                };
            }
        });
    });
};
