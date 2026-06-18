import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";

import { SecurityPermission } from "@webiny/api-core/types/security";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        new ContextPlugin<ApiCoreContext>(async context => {
            await context.tenancy.createTenant({
                id: "root",
                name: "Root",
                parent: "",
                description: "Root tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "webiny",
                name: "Webiny",
                parent: "",
                description: "Webiny tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "dev",
                name: "Dev",
                parent: "",
                description: "Dev tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "sales",
                name: "Sales",
                parent: "",
                description: "Sales tenant",
                tags: []
            });
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root"
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                return permissions || [{ name: "*" }];
            });
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            // Triggers the authenticator chain and seats the resolved identity on the legacy
            // context object so callers using context.security.getIdentity() get the right value.
            await context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
