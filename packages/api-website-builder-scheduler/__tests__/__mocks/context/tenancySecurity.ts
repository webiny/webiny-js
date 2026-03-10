import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { SecurityPermission } from "@webiny/api-core/types/security";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
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
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<ApiCoreContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
