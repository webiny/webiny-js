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
import { AuthenticatedIdentity } from "~/features/security/IdentityContext/index.js";
import { PermissionsProcessor } from "~/features/security/authorization/GroupsTeamsAuthorizer/abstractions.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { AppInstaller, InstallTenantUseCase } from "~/features/tenancy/InstallTenant/index.js";
import type { ITenantPermission } from "~/features/security/authorization/GroupsTeamsAuthorizer/abstractions.js";
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
const createProbeHandler = (options: { scope?: (scope: Container) => void } = {}) => {
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
            public readonly tenantScopes: TenantScopes.Interface,
            public readonly tenantContext: TenantContext.Interface,
            public readonly identityContext: IdentityContext.Interface,
            public readonly container: Container,
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
                    options.scope?.(scope);
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

/** Permissions of the scope it is resolved in: only the root tenant grants any. */
const createRootOnlyPermissions = (processedIn: string[]) => {
    class RootOnlyPermissions implements PermissionsProcessor.Interface {
        constructor(private tenantContext: TenantContext.Interface) {}

        async getPermissions(): Promise<ITenantPermission[] | null> {
            const tenant = this.tenantContext.getTenant().id;
            processedIn.push(tenant);
            return tenant === "root" ? [{ name: "reports.read", _src: "root" }] : null;
        }
    }
    return PermissionsProcessor.createImplementation({
        implementation: RootOnlyPermissions,
        dependencies: [TenantContext]
    });
};

/** An app installer that records the tenant of the scope it runs in. */
const createInstaller = (
    appName: string,
    log: string[],
    options: { dependsOn?: string[]; fails?: boolean } = {}
) => {
    class RecordingInstaller implements AppInstaller.Interface {
        readonly appName = appName;
        readonly dependsOn = options.dependsOn ?? [];

        constructor(private tenantContext: TenantContext.Interface) {}

        async install(): Promise<void> {
            log.push(`install ${appName} in ${this.tenantContext.getTenant().id}`);
            if (options.fails) {
                throw new Error(`${appName} failed`);
            }
        }

        async uninstall(): Promise<void> {
            log.push(`uninstall ${appName} in ${this.tenantContext.getTenant().id}`);
        }
    }
    return AppInstaller.createImplementation({
        implementation: RecordingInstaller,
        dependencies: [TenantContext]
    });
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

    it("reads a role only in the scope of the tenant it was created in", async () => {
        const { run } = createProbeHandler();

        const result = await run(null, async ctx => {
            const created = await ctx.identityContext.withoutAuthorization(() => {
                return ctx.container.resolve(CreateRoleUseCase).execute({
                    name: "Files reader",
                    slug: "files-reader",
                    description: "",
                    permissions: [{ name: "fm.file", rwd: "r" }]
                });
            });
            const role = created.value!;
            const inRoot = await ctx.container.resolve(RolesRepository).get({ id: role.id });

            const acme = await getTenant(ctx, "acme");
            const inAcme = await ctx.tenantScopes.withTenant(acme, async scope => {
                const repository = scope.resolve(RolesRepository);
                return {
                    byId: (await repository.get({ id: role.id })).isOk(),
                    bySlug: (await repository.get({ slug: "files-reader" })).isOk()
                };
            });
            return { inRoot: inRoot.isOk(), inAcme };
        });

        expect(result).toEqual({ inRoot: true, inAcme: { byId: false, bySlug: false } });
    });

    it("reads a sub-tenant user's permissions from the parent tenant's scope", async () => {
        const processedIn: string[] = [];
        const { run } = createProbeHandler({
            scope: scope => scope.register(createRootOnlyPermissions(processedIn))
        });

        const permissions = await run("acme", async ctx => {
            processedIn.length = 0;
            const user = new AuthenticatedIdentity({
                id: "parent-user",
                displayName: "Parent user",
                type: "admin",
                context: { canAccessTenant: true }
            });
            return ctx.identityContext.withIdentity(user, () => {
                return ctx.identityContext.listPermissions();
            });
        });

        // acme's processor finds nothing; root's, built in root's scope, grants the permissions.
        expect(processedIn).toEqual(["acme", "root"]);
        expect(permissions).toContainEqual(expect.objectContaining({ name: "reports.read" }));
    });

    it("installs a tenant with the installers of its own scope", async () => {
        const log: string[] = [];
        const { run, tenancy } = createProbeHandler({
            scope: scope => scope.register(createInstaller("Files", log))
        });
        const fresh = createTenant("fresh", { isInstalled: false, status: "enabled" });
        await tenancy.createTenant(fresh);

        const result = await run(null, async ctx => {
            const installed = await ctx.container.resolve(InstallTenantUseCase).execute({
                tenant: fresh,
                installationInput: [{ app: "Files", data: {} }]
            });
            // The always-run Security installer created the default roles in the new tenant.
            const roles = await ctx.tenantScopes.withTenant(fresh, async scope => {
                const listed = await scope.resolve(RolesRepository).list({});
                return listed.value?.length ?? 0;
            });
            return { ok: installed.isOk(), roles };
        });

        expect(result.ok).toBe(true);
        expect(result.roles).toBeGreaterThan(0);
        expect(log).toEqual(["install Files in fresh"]);
        expect(await tenancy.getTenantsByIds(["fresh"])).toMatchObject([
            { id: "fresh", isInstalled: true, status: "enabled" }
        ]);
    });

    it("rolls a failed tenant install back in the new tenant's scope", async () => {
        const log: string[] = [];
        const { run, tenancy } = createProbeHandler({
            scope: scope => {
                scope.register(createInstaller("Files", log));
                scope.register(
                    createInstaller("Pages", log, { dependsOn: ["Files"], fails: true })
                );
            }
        });
        const broken = createTenant("broken", { isInstalled: false, status: "enabled" });
        await tenancy.createTenant(broken);

        const result = await run(null, async ctx => {
            const installed = await ctx.container.resolve(InstallTenantUseCase).execute({
                tenant: broken,
                installationInput: [
                    { app: "Files", data: {} },
                    { app: "Pages", data: {} }
                ]
            });
            const data = installed.error?.data as { failedApp?: string } | undefined;
            return { failedApp: data?.failedApp };
        });

        expect(result.failedApp).toBe("Pages");
        expect(log).toEqual([
            "install Files in broken",
            "install Pages in broken",
            "uninstall Files in broken"
        ]);
        expect(await tenancy.getTenantsByIds(["broken"])).toMatchObject([
            { id: "broken", isInstalled: false }
        ]);
    });
});
