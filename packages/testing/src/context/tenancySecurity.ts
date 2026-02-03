import type { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { createSecurityRolePlugin } from "@webiny/api-core/legacy/security/plugins/SecurityRolePlugin.js";
import { createSecurityTeamPlugin } from "@webiny/api-core/legacy/security/plugins/SecurityTeamPlugin";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

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

export const FULL_ACCESS_ROLE_ID = "full-access-role";
export const FULL_ACCESS_TEAM_ID = "full-access-team";
export const UNKNOWN_TEAM_ID = "unknown-team";

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        createSecurityRolePlugin({
            id: FULL_ACCESS_ROLE_ID,
            name: "Full Access",
            description: "Full access",
            permissions: [{ name: "*" }]
        }),
        createSecurityTeamPlugin({
            id: FULL_ACCESS_TEAM_ID,
            name: "Full access",
            description: "Full access",
            roles: ["full-access"]
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            context.adminUsers.listUserTeams = async () => {
                return await context.security.listTeams();
            };
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            await context.tenancy.createTenant({
                id: "root",
                name: "Root",
                parent: "",
                status: "enabled",
                description: "Root tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "webiny",
                name: "Webiny",
                parent: "",
                status: "enabled",
                description: "Webiny tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "dev",
                name: "Dev",
                parent: "",
                status: "enabled",
                description: "Dev tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "sales",
                name: "Sales",
                parent: "",
                status: "enabled",
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
                return {
                    ...(identity || defaultIdentity),
                    teams: ["full-access-team"]
                };
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
