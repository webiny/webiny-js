import { ContextPlugin } from "@webiny/api";
import { SecurityPermission } from "@webiny/api-core/types/security";

import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

interface Config {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    return [
        new ContextPlugin<ApiCoreContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                isInstalled: true,
                settings: {
                    domains: []
                },
                status: "unknown",
                description: "",
                parent: null,
                tags: [],
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                return (
                    identity || {
                        id: "12345678",
                        type: "admin",
                        displayName: "John Doe"
                    }
                );
            });

            context.security.addAuthorizer(async () => {
                return permissions || [{ name: "*" }];
            });
        }),
        new ContextPlugin<ApiCoreContext>(context => {
            // Triggers the authenticator chain and seats the resolved identity on the legacy
            // context object so callers using context.security.getIdentity() get the right value.
            return context.security.authenticate("");
        })
    ];
};
