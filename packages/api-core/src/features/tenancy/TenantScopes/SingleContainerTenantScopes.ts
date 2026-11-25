import type { Abstraction, Container } from "@webiny/di";
import { RequestContainer } from "@webiny/api-kernel-core";
import {
    DEFAULT_TENANT_STORAGE,
    type TenantScope,
    TenantScopes as Abstraction_
} from "./abstractions.js";
import { NoTenantScopesError, UnknownTenantStorageError } from "./errors.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { assertTenantEnabled } from "~/features/tenancy/TenantContext/errors.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import type { Tenant } from "~/types/tenancy.js";

class ContainerScope implements TenantScope.Interface {
    public readonly storage = DEFAULT_TENANT_STORAGE;

    constructor(
        public readonly tenant: Tenant,
        private readonly container: Container
    ) {}

    resolve<T>(abstraction: Abstraction<T>): T {
        return this.container.resolve(abstraction);
    }

    resolveAll<T>(abstraction: Abstraction<T>): T[] {
        return this.container.resolveAll(abstraction);
    }
}

/**
 * `TenantScopes` of a container that holds the whole API for one tenant: `ApiCoreFeature`
 * registered without `tenantScope`, as the test harnesses that don't build tenant scopes do. Its
 * only scope is the container itself, for the container's own tenant. Any other tenant throws
 * `NoTenantScopesError`: its services would act on the container's tenant.
 *
 * `RequestContainer` is the container that holds the whole API: `ApiCoreFeature` registers it there.
 */
class TenantScopesSingleContainerImpl implements Abstraction_.Interface {
    constructor(
        private readonly container: Container,
        private readonly tenantContext: TenantContext.Interface,
        private readonly getRootTenant: GetRootTenantUseCase.Interface
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

        const current = this.tenantContext.getTenant();
        if (!current || current.id !== tenant.id) {
            throw new NoTenantScopesError(current?.id, tenant.id);
        }
        return cb(new ContainerScope(current, this.container));
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
}

export const SingleContainerTenantScopes = Abstraction_.createImplementation({
    implementation: TenantScopesSingleContainerImpl,
    dependencies: [RequestContainer, TenantContext, GetRootTenantUseCase]
});
