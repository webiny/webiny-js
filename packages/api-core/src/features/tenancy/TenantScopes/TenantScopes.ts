import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import type { Container } from "@webiny/di";
import { createImplementation } from "@webiny/feature/api";
import { KernelExecution, RequestContainer } from "@webiny/api-kernel-core";
import {
    DEFAULT_TENANT_STORAGE,
    TenantScope,
    TenantScopeRegistration,
    TenantScopes as Abstraction_
} from "./abstractions.js";
import { TenantScopeImpl } from "./TenantScopeImpl.js";
import { TenantScopeIdentity } from "./TenantScopeIdentity.js";
import { MissingTenantScopeRegistrationError, UnknownTenantStorageError } from "./errors.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { assertTenantEnabled } from "~/features/tenancy/TenantContext/errors.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { Logger } from "~/features/logger/index.js";
import type { Tenant } from "~/types/tenancy.js";

class TenantScopesImpl implements Abstraction_.Interface {
    private readonly scopes = new Map<string, Promise<TenantScopeImpl>>();
    /** The scope the calling code runs in, so a nested `withTenant()` knows its caller. */
    private readonly current = new AsyncLocalStorage<TenantScopeImpl>();

    constructor(
        private readonly requestContainer: Container,
        private readonly getRootTenant: GetRootTenantUseCase.Interface,
        private readonly registration: TenantScopeRegistration.Interface | undefined,
        private readonly kernelExecution: KernelExecution.Interface | undefined,
        private readonly logger: Logger.Interface | undefined
    ) {}

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
        const scope = await this.getScope(tenant, storage);
        return this.enter(scope, caller, cb);
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

    private getScope(tenant: Tenant, storage: string): Promise<TenantScopeImpl> {
        const key = `${tenant.id}::${storage}`;
        const existing = this.scopes.get(key);
        if (existing) {
            return existing;
        }
        const created = this.createScope(tenant, storage);
        this.scopes.set(key, created);
        // A scope that failed to build is built again on the next call.
        created.catch(() => {
            if (this.scopes.get(key) === created) {
                this.scopes.delete(key);
            }
        });
        return created;
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

        this.logger?.debug(
            {
                tenant: tenant.id,
                storage,
                durationMs: Math.round((performance.now() - startedAt) * 100) / 100
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
        [Logger, { optional: true }]
    ]
});
