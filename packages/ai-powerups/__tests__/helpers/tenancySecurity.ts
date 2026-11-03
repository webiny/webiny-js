import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { Context } from "@webiny/handler/types.js";

interface Config {
    permissions: SecurityPermission[];
    /**
     * `undefined` uses `defaultIdentity`, `null` makes the caller anonymous.
     */
    identity?: IdentityData | null;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        new ContextPlugin<Context>(context => {
            context.tenancy.setCurrentTenant({
                id: context.request.headers["x-tenant"] || "root",
                name: context.request.headers["x-tenant"] || "Root"
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                if (identity === null) {
                    return null;
                }
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                return permissions;
            });
        }),
        new BeforeHandlerPlugin<Context>(context => {
            return context.security.authenticate("");
        })
    ];
};
