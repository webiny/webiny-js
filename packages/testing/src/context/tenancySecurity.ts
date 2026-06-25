import type { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { RoleFactory } from "@webiny/api-core/features/security/roles/shared/abstractions.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { Authenticator } from "@webiny/api-core/features/security/authentication/Authenticator/index.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { CreateTenantUseCase } from "@webiny/api-core/features/tenancy/CreateTenant/index.js";

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

class FullAccessRoleFactory implements RoleFactory.Interface {
    async execute(): RoleFactory.Return {
        return [
            {
                name: "Full Access",
                slug: FULL_ACCESS_ROLE_ID,
                description: "Full access",
                permissions: [{ name: "*" }]
            }
        ];
    }
}

class FullAccessTeamFactory implements TeamFactory.Interface {
    async execute(): TeamFactory.Return {
        return [
            {
                name: "Full access",
                slug: FULL_ACCESS_TEAM_ID,
                description: "Full access",
                roles: ["full-access"]
            }
        ];
    }
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        new ContextPlugin<ApiCoreContext>(async context => {
            context.container.registerInstance(RoleFactory, new FullAccessRoleFactory());
            context.container.registerInstance(TeamFactory, new FullAccessTeamFactory());
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            const createTenant = context.container.resolve(CreateTenantUseCase);

            for (const data of [
                { id: "root", name: "Root", parent: "", description: "Root tenant", tags: [] },
                {
                    id: "webiny",
                    name: "Webiny",
                    parent: "",
                    description: "Webiny tenant",
                    tags: []
                },
                { id: "dev", name: "Dev", parent: "", description: "Dev tenant", tags: [] },
                { id: "sales", name: "Sales", parent: "", description: "Sales tenant", tags: [] }
            ]) {
                const result = await createTenant.execute(data);
                if (result.isFail()) {
                    throw result.error;
                }
            }
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            context.container.resolve(TenantContext).setTenant({
                id: "root",
                name: "Root"
            } as unknown as Tenant);

            context.container.registerFactory(Authenticator, () => ({
                authenticate: async () => ({
                    ...(identity || defaultIdentity),
                    teams: ["full-access-team"]
                })
            }));

            context.container.registerFactory(Authorizer, () => ({
                authorize: async () => permissions || [{ name: "*" }]
            }));
        }),
        new ContextPlugin<ApiCoreContext>(async context => {
            const authCtx = context.container.resolve(AuthenticationContext);
            const resolvedIdentity = await authCtx.authenticate("");
            context.container.resolve(IdentityContext).setIdentity(resolvedIdentity);
        })
    ].filter(Boolean) as Plugin[];
};
