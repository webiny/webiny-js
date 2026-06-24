import type { Container } from "@webiny/di";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer, IGraphQLContextualSchema } from "@webiny/handler-graphql";
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
import type { SecurityPermission, ApiKey } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { defaultIdentity, FULL_ACCESS_TEAM_ID } from "./tenancySecurity.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

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

class TenancyAndSecurityInitializerImpl
    implements IGraphQLContextEnhancer, IGraphQLContextualSchema
{
    private initialized = false;

    constructor(
        private container: Container,
        private config: Config
    ) {}

    // Runs during the enhance phase so that ctx.security / ctx.tenancy are fully
    // initialised (authenticated identity + current tenant) before HeadlessCms's
    // enhance() runs, which needs them to bootstrap the CMS context.
    async enhance(ctx: Record<string, any>): Promise<void> {
        await this._maybeInitialize(ctx);
    }

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        await this._maybeInitialize(ctx);
        return STUB_SCHEMA;
    }

    private async _maybeInitialize(ctx: Record<string, any>): Promise<void> {
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

        // Patch the legacy security bridge with a mock getApiKeyByToken used by tests
        // that call ctx.security.getApiKeyByToken("aToken").
        if (ctx.security) {
            ctx.security.getApiKeyByToken = async (token: string): Promise<ApiKey | null> => {
                if (!token || token !== "aToken") {
                    return null;
                }
                const id = "a1234567890";
                return {
                    id,
                    name: id,
                    slug: id,
                    permissions: resolvedIdentity.permissions || [],
                    token,
                    createdBy: { id: "test", displayName: "test", type: "admin" },
                    description: "test",
                    createdOn: new Date().toISOString()
                };
            };
        }
    }
}

export const TenancyAndSecurityFeature = {
    register(container: Container, config: Config): void {
        const initializer = new TenancyAndSecurityInitializerImpl(container, config);
        container.registerInstance(GraphQLContextEnhancer, initializer);
        container.registerInstance(GraphQLContextualSchema, initializer);
    }
};
