import type { Container } from "@webiny/di";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { buildSchema } from "graphql";
import type { GraphQLSchema } from "graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { CreateTenantUseCase } from "@webiny/api-core/features/tenancy/CreateTenant/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { Authenticator } from "@webiny/api-core/features/security/authentication/Authenticator/abstractions.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import { RoleFactory } from "@webiny/api-core/features/security/roles/shared/abstractions.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/Identity.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { defaultIdentity, FULL_ACCESS_TEAM_ID } from "./tenancySecurity.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export { defaultIdentity };

class FullAccessRoleFactory implements RoleFactory.Interface {
    async execute(): RoleFactory.Return {
        return [
            {
                name: "Full Access",
                slug: "full-access-role",
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
                slug: "full-access-team",
                description: "Full access",
                roles: ["full-access"]
            }
        ];
    }
}

const STUB_SCHEMA: GraphQLSchema = buildSchema("type Query { _empty: String }");

const TEST_TENANTS = [
    { id: "root", name: "Root", parent: "", description: "Root tenant", tags: [] as string[] },
    {
        id: "webiny",
        name: "Webiny",
        parent: "",
        description: "Webiny tenant",
        tags: [] as string[]
    },
    { id: "dev", name: "Dev", parent: "", description: "Dev tenant", tags: [] as string[] },
    { id: "sales", name: "Sales", parent: "", description: "Sales tenant", tags: [] as string[] }
];

class TenancyAndSecurityInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(
        private container: Container,
        private config: Config
    ) {}

    async build(_ctx: Record<string, any>): Promise<GraphQLSchema> {
        await this._maybeInitialize();
        return STUB_SCHEMA;
    }

    private async _maybeInitialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        const { permissions, identity } = this.config;
        const resolvedIdentity: IdentityData = identity ?? defaultIdentity;

        // Provide role/team definitions for the authorization system.
        this.container.registerInstance(RoleFactory, new FullAccessRoleFactory());
        this.container.registerInstance(TeamFactory, new FullAccessTeamFactory());

        // Register an authenticator that returns the configured test identity.
        this.container.registerFactory(Authenticator, () => ({
            authenticate: async (_token: string): Promise<IdentityData | null> => ({
                ...resolvedIdentity,
                teams: [FULL_ACCESS_TEAM_ID]
            })
        }));

        // Register an authorizer that returns the configured test permissions.
        this.container.registerFactory(Authorizer, () => ({
            authorize: async () => permissions || [{ name: "*" }]
        }));

        // Seed the canonical test tenants in storage.
        const createTenant = this.container.resolve(CreateTenantUseCase);
        for (const input of TEST_TENANTS) {
            await createTenant.execute(input);
        }

        // Set the current tenant to root.
        const tenantCtx = this.container.resolve(TenantContext);
        tenantCtx.setTenant({ id: "root", name: "Root" } as unknown as Tenant);

        // Authenticate and seat the resolved identity on IdentityContext.
        const authCtx = this.container.resolve(AuthenticationContext);
        const authedIdentity = await authCtx.authenticate("");
        const identityCtx = this.container.resolve(IdentityContext);
        identityCtx.setIdentity(authedIdentity);
    }
}

export const TenancyAndSecurityFeature = {
    register(container: Container, config: Config): void {
        const initializer = new TenancyAndSecurityInitializerImpl(container, config);
        container.registerInstance(GraphQLContextualSchema, initializer);
    }
};
