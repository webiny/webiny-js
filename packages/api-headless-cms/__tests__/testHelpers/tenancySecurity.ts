import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";

import type { TestContext } from "./types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

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
    return [
        new ContextPlugin<TestContext>(context => {
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
        new ContextPlugin<TestContext>(async context => {
            await context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
