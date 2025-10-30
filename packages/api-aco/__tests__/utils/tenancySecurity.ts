import { ContextPlugin } from "@webiny/api";
import { SecurityPermission } from "@webiny/api-core/types/security.js";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

interface Config {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    return [
        new ContextPlugin<ApiCoreContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                settings: {
                    domains: []
                },
                isInstalled: true,
                status: "unknown",
                description: "",
                parent: null,
                tags: [],
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                webinyVersion: "w.w.w"
            });

            context.security.addAuthenticator(async () => {
                // `undefined` results in the default identity being set; `null` means "anonymous request".
                return identity === undefined ? defaultIdentity : identity;
            });

            context.security.addAuthorizer(async () => {
                return typeof permissions === "undefined" ? [{ name: "*" }] : permissions;
            });
        }),
        new BeforeHandlerPlugin<ApiCoreContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
