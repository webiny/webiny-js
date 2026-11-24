import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { RequestContainer, StaleKernelExecutionError } from "@webiny/api-kernel-core";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import {
    TestHttpInputHandler,
    createTestHttpHandler
} from "@webiny/api-kernel-core/features/testing";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import { registerApiCoreStorageOperations } from "~/features/storageOperations/abstractions.js";
import { getStorageOps } from "~/testing/environment.js";
import { Logger, NullLogger } from "~/features/logger/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import {
    TenantAlreadySetError,
    TenantIsDisabledError
} from "~/features/tenancy/TenantContext/errors.js";
import {
    TenantNeutralRequestFeature,
    TenantScope,
    TenantScopeRegistration,
    TenantScopes,
    TenantScopesRootFeature,
    UnknownTenantStorageError
} from "~/features/tenancy/TenantScopes/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { Tenant, TenancyStorageOperations } from "~/types/tenancy.js";
import { TestAuthenticator } from "../mocks/TestAuthenticator.js";
import { TestAuthorizer } from "../mocks/TestAuthorizer.js";
import { AuthTriggerHandler } from "../handlers/AuthTriggerHandler.js";
import { TestHttpTenantSource } from "../handlers/TestHttpTenantSource.js";

const createTenant = (id: string, overrides: Partial<Tenant> = {}): Tenant => {
    const now = new Date().toISOString();
    return {
        id,
        name: id,
        description: "",
        status: "enabled",
        isInstalled: true,
        settings: {},
        tags: [],
        parent: id === "root" ? null : "root",
        createdOn: now,
        savedOn: now,
        ...overrides
    };
};

class InMemoryTenancyStorageOperations implements TenancyStorageOperations {
    private tenants = new Map<string, Tenant>();

    constructor(tenants: Tenant[]) {
        tenants.forEach(tenant => this.tenants.set(tenant.id, tenant));
    }

    async getTenantsByIds(ids: readonly string[]) {
        return ids.map(id => this.tenants.get(id)).filter(Boolean) as Tenant[];
    }

    async listTenants() {
        return [...this.tenants.values()];
    }

    async createTenant(tenant: Tenant) {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async updateTenant(tenant: Tenant) {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async deleteTenant(id: string) {
        this.tenants.delete(id);
    }
}

interface ProbeContext {
    tenantScopes: TenantScopes.Interface;
    tenantContext: TenantContext.Interface;
    identityContext: IdentityContext.Interface;
    container: Container;
}

type Probe = (ctx: ProbeContext) => Promise<unknown>;

/**
 * A handler app that runs the way the API does: the request container is tenant-neutral, and the
 * request runs in the scope of its `x-tenant` header's tenant. The probe runs in place of the
 * router, with services resolved for the handler chain, and its result is the response.
 */
const createProbeHandler = () => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const tenancy = new InMemoryTenancyStorageOperations([
        createTenant("root"),
        createTenant("acme"),
        createTenant("globex"),
        createTenant("closed", { status: "disabled" })
    ]);

    const requestContainers: Container[] = [];
    const scopeRegistrations: string[] = [];
    let probe: Probe = async () => null;

    class ProbeDecorator implements TestHttpInputHandler.Interface {
        constructor(
            private tenantScopes: TenantScopes.Interface,
            private tenantContext: TenantContext.Interface,
            private identityContext: IdentityContext.Interface,
            private container: Container,
            // The router it replaces is never called.
            private decoratee: TestHttpInputHandler.Interface
        ) {}

        execute(_ctx: InputContext, _next: NextFunction): Promise<unknown> {
            return probe(this);
        }
    }

    const ProbeHandler = TestHttpInputHandler.createDecorator({
        decorator: ProbeDecorator,
        dependencies: [TenantScopes, TenantContext, IdentityContext, RequestContainer]
    });

    const handler = createTestHttpHandler({
        root: container => {
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            // Registered first: the inner one, so the identity is loaded before the probe runs.
            container.registerDecorator(ProbeHandler);
            container.registerDecorator(AuthTriggerHandler);
            TenantScopesRootFeature.register(container);
            container.register(TestHttpTenantSource);
        },
        child: container => {
            requestContainers.push(container);
            registerApiCoreStorageOperations(container, {
                ...apiCoreStorage.storageOperations,
                tenancyStorageOperations: tenancy
            });
            container.registerInstance(Logger, new NullLogger());
            TenantNeutralRequestFeature.register(container);
            container.registerInstance(TenantScopeRegistration, {
                register: async scope => {
                    ApiCoreFeature.register(scope, { tenantScope: true });
                    scopeRegistrations.push(String(scopeRegistrations.length));
                }
            });
        }
    });

    const run = <T>(tenant: string | null, fn: (ctx: ProbeContext) => Promise<T>): Promise<T> => {
        probe = fn;
        const headers: Record<string, string> = tenant ? { "x-tenant": tenant } : {};
        return handler({ method: "POST", path: "/probe", headers }) as unknown as Promise<T>;
    };

    return {
        run,
        tenancy,
        getRequestContainer: () => requestContainers[requestContainers.length - 1],
        countScopeRegistrations: () => scopeRegistrations.length
    };
};

const getTenant = async (ctx: ProbeContext, id: string): Promise<Tenant> => {
    const result = await ctx.container.resolve(GetTenantByIdUseCase).execute(id);
    return result.value as Tenant;
};

describe("Tenant scopes", () => {
    it("runs a request's handler chain in the scope of its tenant", async () => {
        const { run, getRequestContainer } = createProbeHandler();

        const result = await run("acme", async ctx => {
            return {
                tenant: ctx.tenantContext.getTenant().id,
                // The router and resolvers use RequestContainer: in a scope, it is the scope.
                containerIsScope: ctx.container !== getRequestContainer(),
                scopeTenant: ctx.container.resolve(TenantScope).tenant.id
            };
        });

        expect(result).toEqual({ tenant: "acme", containerIsScope: true, scopeTenant: "acme" });
    });

    it("runs a request without a tenant as the root tenant", async () => {
        const { run } = createProbeHandler();

        const tenant = await run(null, async ctx => ctx.tenantContext.getTenant().id);

        expect(tenant).toBe("root");
    });

    it("refuses a request to a disabled tenant", async () => {
        const { run } = createProbeHandler();

        await expect(run("closed", async () => "ran")).rejects.toBeInstanceOf(
            TenantIsDisabledError
        );
    });

    it("keeps the request container tenant-neutral", async () => {
        const { run, getRequestContainer } = createProbeHandler();

        await run("acme", async () => null);
        const requestContainer = getRequestContainer();

        expect(() => requestContainer.resolve(TenantContext)).toThrow(
            "No registration found for TenantContext"
        );
        expect(() => requestContainer.resolve(IdentityContext)).toThrow(
            "No registration found for IdentityContext"
        );
        // The tenant-neutral part is there: the registry the tenant is loaded from, and the scopes.
        expect(requestContainer.resolve(GetTenantByIdUseCase)).toBeTruthy();
        expect(requestContainer.resolve(TenantScopes)).toBeTruthy();
    });

    it("builds each tenant's scope once per request", async () => {
        const { run, countScopeRegistrations } = createProbeHandler();

        const result = await run("acme", async ctx => {
            const globex = await getTenant(ctx, "globex");
            const first = await ctx.tenantScopes.withTenant(globex, async scope => scope);
            const second = await ctx.tenantScopes.withTenant(globex, async scope => scope);
            const acme = await ctx.tenantScopes.withTenant(
                await getTenant(ctx, "acme"),
                async scope => scope
            );
            return {
                sameScope: first === second,
                requestScopeReused: acme === ctx.container.resolve(TenantScope),
                tenants: [first.tenant.id, acme.tenant.id]
            };
        });

        expect(result).toEqual({
            sameScope: true,
            requestScopeReused: true,
            tenants: ["globex", "acme"]
        });
        // The request's own scope (acme) and globex's.
        expect(countScopeRegistrations()).toBe(2);
    });

    it("resolves a scope's services for the scope's tenant", async () => {
        const { run } = createProbeHandler();

        const tenants = await run("acme", async ctx => {
            const globex = await getTenant(ctx, "globex");
            return ctx.tenantScopes.withTenant(globex, async scope => {
                return {
                    inScope: scope.resolve(TenantContext).getTenant().id,
                    root: await ctx.tenantScopes.withRootTenant(async root => {
                        return root.resolve(TenantContext).getTenant().id;
                    })
                };
            });
        });

        expect(tenants).toEqual({ inScope: "globex", root: "root" });
    });

    it("throws when a service of one scope is used inside another scope", async () => {
        const { run } = createProbeHandler();

        const error = await run("acme", async ctx => {
            const globex = await getTenant(ctx, "globex");
            // `ctx.tenantContext` belongs to acme's scope.
            return ctx.tenantScopes
                .withTenant(globex, async () => ctx.tenantContext.getTenant())
                .then(() => null)
                .catch(error => error);
        });

        expect(error).toBeInstanceOf(StaleKernelExecutionError);
        expect(error.message).toContain(
            `TenantContext belongs to scope "tenant:acme" of kernel execution`
        );
        expect(error.message).toContain(`but was used inside scope "tenant:globex"`);
    });

    it("runs the callback as the caller's identity, with the caller's authorization state", async () => {
        const { run } = createProbeHandler();

        const result = await run("acme", async ctx => {
            const globex = await getTenant(ctx, "globex");
            const withAuthorization = await ctx.tenantScopes.withTenant(globex, async scope => {
                const identityContext = scope.resolve(IdentityContext);
                return {
                    identity: identityContext.getIdentity().id,
                    authorization: identityContext.isAuthorizationEnabled()
                };
            });
            const withoutAuthorization = await ctx.identityContext.withoutAuthorization(() => {
                return ctx.tenantScopes.withTenant(globex, async scope => {
                    return scope.resolve(IdentityContext).isAuthorizationEnabled();
                });
            });
            return { withAuthorization, withoutAuthorization };
        });

        // The identity was loaded only in acme's scope; globex's runs the same user.
        expect(result).toEqual({
            withAuthorization: { identity: "123456789", authorization: true },
            withoutAuthorization: false
        });
    });

    it("refuses a storage other than the deploy's", async () => {
        const { run } = createProbeHandler();

        const error = await run("acme", async ctx => {
            const globex = await getTenant(ctx, "globex");
            return ctx.tenantScopes
                .withTenant(globex, async () => null, { storage: "other" })
                .catch(error => error);
        });

        expect(error).toBeInstanceOf(UnknownTenantStorageError);
    });

    it("sets a scope's tenant once: the same tenant refreshes it, another one throws", async () => {
        const { run } = createProbeHandler();

        const result = await run("acme", async ctx => {
            const renamed = { ...ctx.tenantContext.getTenant(), name: "Acme Renamed" };
            ctx.tenantContext.setTenant(renamed);
            const refreshed = ctx.tenantContext.getTenant().name;

            const globex = await getTenant(ctx, "globex");
            let error: unknown = null;
            try {
                ctx.tenantContext.setTenant(globex);
            } catch (ex) {
                error = ex;
            }
            return { refreshed, error, tenant: ctx.tenantContext.getTenant().id };
        });

        expect(result.refreshed).toBe("Acme Renamed");
        expect(result.error).toBeInstanceOf(TenantAlreadySetError);
        expect(result.tenant).toBe("acme");
    });
});
