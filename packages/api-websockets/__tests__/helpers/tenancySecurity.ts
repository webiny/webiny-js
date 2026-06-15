import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";

import type { Context } from "~tests/types";
import { type SecurityPermission } from "@webiny/api-core/types/security";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Tenant } from "@webiny/api-core/types/tenancy";

interface Config {
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    const mockSecurityContextPlugin = new ContextPlugin<Context>(context => {
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
    });
    mockSecurityContextPlugin.name = "testing.mock-security-context";

    return [
        mockSecurityContextPlugin,
        new ContextPlugin<Context>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
