import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { TestContext } from "./types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
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
                name: "Root",
                webinyVersion: context.WEBINY_VERSION
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
        new BeforeHandlerPlugin<TestContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
