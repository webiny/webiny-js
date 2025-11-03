import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { HcmsTasksContext } from "~/types";
import { SecurityPermission } from "@webiny/api-core/types/security";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
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

export const createTenancyAndSecurity = ({
    permissions,
    identity
}: Config): Plugin[] => {
    return [
        new ContextPlugin<HcmsTasksContext>(async context => {
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
        new ContextPlugin<HcmsTasksContext>(async context => {
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
        new BeforeHandlerPlugin<HcmsTasksContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
