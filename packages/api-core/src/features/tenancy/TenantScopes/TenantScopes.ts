import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import type { Container } from "@webiny/di";
import { createImplementation } from "@webiny/feature/api";
import { KernelExecution, RequestContainer } from "@webiny/api-kernel-core";
import {
    DEFAULT_TENANT_STORAGE,
    TenantScope,
    TenantScopeRegistration,
    TenantScopeUsage,
    TenantScopes as Abstraction_
} from "./abstractions.js";
import { TenantScopeImpl } from "./TenantScopeImpl.js";
import { TenantScopeIdentity } from "./TenantScopeIdentity.js";
import { MissingTenantScopeRegistrationError, UnknownTenantStorageError } from "./errors.js";
import {
    getTenantScopeCacheSize,
    TENANT_SCOPE_CACHE_SIZE_BUILD_PARAM
} from "./tenantScopeCacheSize.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { assertTenantEnabled } from "~/features/tenancy/TenantContext/errors.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { Logger } from "~/features/logger/index.js";
import { BuildParams } from "~/features/buildParams/abstractions.js";
import type { Tenant } from "~/types/tenancy.js";

/** A cached scope, and how many `withTenant` callbacks run in it now. */
interface ScopeEntry {
    readonly key: string;
    readonly scope: Promise<TenantScopeImpl>;
    inUse: number;
}

class TenantScopesImpl implements Abstraction_.Interface {
    /** Every scope kept: in use, being built, or idle. */
    private readonly scopes = new Map<string, ScopeEntry>();
    /** The idle ones among them, least recently used first. */
    private readonly idle = new Map<string, ScopeEntry>();
    private inUseCount = 0;
    /** How many idle scopes stay cached; `Infinity` keeps them all until the request ends. */
    private readonly cacheSize: number;
    /** The scope the calling code runs in, so a nested `withTenant()` knows its caller. */
    private readonly current = new AsyncLocalStorage<TenantScopeImpl>();

    constructor(
        private readonly requestContainer: Container,
        private readonly getRootTenant: GetRootTenantUseCase.Interface,
        private readonly registration: TenantScopeRegistration.Interface | undefined,
        private readonly kernelExecution: KernelExecution.Interface | undefined,
        private readonly usage: TenantScopeUsage.Interface | undefined,
        private readonly logger: Logger.Interface | undefined,
        buildParams: BuildParams.Interface
    ) {
        this.cacheSize = getTenantScopeCacheSize(
            buildParams.get<string | number>(TENANT_SCOPE_CACHE_SIZE_BUILD_PARAM)
        );
    }

    async withTenant<R>(
        tenant: Tenant,
        cb: (scope: TenantScope.Interface) => Promise<R>,
        opts: Abstraction_.Options = {}
    ): Promise<R> {
        const storage = opts.storage ?? DEFAULT_TENANT_STORAGE;
        if (storage !== DEFAULT_TENANT_STORAGE) {
            throw new UnknownTenantStorageError(storage);
        }
        assertTenantEnabled(tenant);

        const caller = this.current.getStore();
        // In use from here, before it is built: a scope being built is never released.
        const entry = this.acquire(tenant, storage);
        try {
            const scope = await entry.scope;
            return await this.enter(scope, caller, cb);
        } finally {
            this.release(entry);
        }
    }

    async withRootTenant<R>(cb: (scope: TenantScope.Interface) => Promise<R>): Promise<R> {
        const result = await this.getRootTenant.execute();
        if (result.isFail()) {
            throw result.error;
        }
        return this.withTenant(result.value, cb);
    }

    async withEachTenant<R>(
        tenants: Tenant[],
        cb: (scope: TenantScope.Interface) => Promise<R>
    ): Promise<R[]> {
        const results: R[] = [];
        for (const tenant of tenants) {
            results.push(await this.withTenant(tenant, cb));
        }
        return results;
    }

    private enter<R>(
        scope: TenantScopeImpl,
        caller: TenantScopeImpl | undefined,
        cb: (scope: TenantScope.Interface) => Promise<R>
    ): Promise<R> {
        const run = () => this.current.run(scope, () => cb(scope));

        /*
         * The request entering its own tenant's scope, or a scope entering itself: there is no other
         * identity to carry, the scope loads or already has its own.
         */
        if (!caller || caller === scope) {
            return scope.runInFrame(run);
        }

        /*
         * Read in the caller's frame: its identity context belongs to the caller's scope. The same
         * user then runs in the target scope, checked against that tenant's permissions.
         */
        const callerIdentity = caller.getIdentityContext();
        if (!callerIdentity) {
            return scope.runInFrame(run);
        }
        const identity = callerIdentity.getIdentity();
        const authorizationEnabled = callerIdentity.isAuthorizationEnabled();

        return scope.runInFrame(() => {
            const identityContext = scope.getIdentityContext();
            if (!identityContext) {
                return run();
            }
            return identityContext.withIdentity(identity, () => {
                return authorizationEnabled
                    ? identityContext.withAuthorization(run)
                    : identityContext.withoutAuthorization(run);
            });
        });
    }

    private acquire(tenant: Tenant, storage: string): ScopeEntry {
        const key = `${tenant.id}::${storage}`;
        let entry = this.scopes.get(key);
        if (!entry) {
            const created = this.createScope(tenant, storage);
            const newEntry: ScopeEntry = { key, scope: created, inUse: 0 };
            // A scope that failed to build is built again on the next call.
            created.catch(() => {
                if (this.scopes.get(key) === newEntry) {
                    this.scopes.delete(key);
                }
            });
            this.scopes.set(key, newEntry);
            entry = newEntry;
        }

        if (entry.inUse === 0) {
            this.idle.delete(key);
            this.inUseCount++;
        }
        entry.inUse++;
        this.usage?.counts(this.scopes.size, this.inUseCount);
        return entry;
    }

    private release(entry: ScopeEntry): void {
        entry.inUse--;
        if (entry.inUse > 0) {
            return;
        }
        this.inUseCount--;
        // A scope that failed to build is no longer kept.
        if (this.scopes.get(entry.key) !== entry) {
            return;
        }
        this.idle.set(entry.key, entry);
        this.evictIdle();
    }

    /**
     * Drops the least recently used idle scopes past the cache size. Nothing else references a
     * dropped scope (a parent container keeps no reference to its children), so its container and
     * everything built in it can be garbage collected.
     */
    private evictIdle(): void {
        while (this.idle.size > this.cacheSize) {
            const [key] = this.idle.keys();
            this.idle.delete(key);
            this.scopes.delete(key);
            this.usage?.scopeReleased();
        }
    }

    private async createScope(tenant: Tenant, storage: string): Promise<TenantScopeImpl> {
        if (!this.registration) {
            throw new MissingTenantScopeRegistrationError();
        }
        const startedAt = performance.now();

        const container = this.requestContainer.createChildContainer();
        // Everything that resolves "the current container" (the HTTP router, GraphQL resolvers,
        // task and websocket runners) resolves from the scope.
        container.registerInstance(RequestContainer, container);

        const execution = this.kernelExecution?.createNested(`tenant:${tenant.id}`);
        if (execution) {
            container.registerInstance(KernelExecution, execution);
        }

        const scope = new TenantScopeImpl(tenant, storage, container, execution);
        container.registerInstance(TenantScope, scope);
        container.register(TenantScopeIdentity);

        await scope.runInFrame(async () => {
            await this.registration!.register(container);
            container.resolve(TenantContext).setTenant(tenant);
        });

        const durationMs = performance.now() - startedAt;
        this.usage?.scopeBuilt(durationMs);
        this.logger?.debug(
            {
                tenant: tenant.id,
                storage,
                durationMs: Math.round(durationMs * 100) / 100
            },
            "[tenancy] Built a tenant scope."
        );

        return scope;
    }
}

export const TenantScopes = createImplementation({
    abstraction: Abstraction_,
    implementation: TenantScopesImpl,
    dependencies: [
        RequestContainer,
        GetRootTenantUseCase,
        [TenantScopeRegistration, { optional: true }],
        [KernelExecution, { optional: true }],
        [TenantScopeUsage, { optional: true }],
        [Logger, { optional: true }],
        BuildParams
    ]
});
