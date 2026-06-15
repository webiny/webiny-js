import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";

import type { HcmsBulkActionsContext } from "~/types";
import { SecurityPermission } from "@webiny/api-core/types/security";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

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
        new ContextPlugin<HcmsBulkActionsContext>(context => {
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
        new ContextPlugin<HcmsBulkActionsContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
