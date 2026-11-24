import type { Container } from "@webiny/di";
import { createFeature } from "@webiny/feature/api";
import type { InputChainRunner, KernelSetup } from "@webiny/api-kernel-core";
import { TestHttpInputHandler } from "@webiny/api-kernel-core/features/testing";
import {
    InputTenantSource,
    TenantNeutralRequestFeature,
    TenantScopeRegistration,
    TenantScopesRootFeature
} from "@webiny/api-core/features/tenancy/TenantScopes/index.js";

class TestHttpTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== TestHttpInputHandler) {
            return undefined;
        }
        const headers: Record<string, string> = request.input?.headers ?? {};
        return { tenantId: headers["x-tenant"] || null };
    }
}

/** A test HTTP request runs in the tenant of its `x-tenant` header, or the root tenant without one. */
export const TestHttpTenantSource = InputTenantSource.createImplementation({
    implementation: TestHttpTenantSourceImpl,
    dependencies: []
});

/**
 * Root part of a test handler that runs its requests the way the API does: each in its tenant's
 * scope. Register it in the test handler's `root`, and build its `child` with
 * {@link createTenantScopedChild}.
 */
export const TestTenantScopesFeature = createFeature({
    name: "TestTenantScopes",
    register(container: Container) {
        TenantScopesRootFeature.register(container);
        container.register(TestHttpTenantSource);
    }
});

export interface TenantScopedChildSetup {
    /**
     * Tenant-neutral registrations of the request container, before its tenant registry is built:
     * the storage it reads the tenants from (`registerApiCoreStorageOperations`), the logger.
     */
    request?: KernelSetup;
    /** What each tenant scope of the request registers: `ApiCoreFeature` with `tenantScope: true`, and the rest. */
    scope: KernelSetup;
}

/**
 * The `child` of a test handler whose requests run in tenant scopes: the request container gets the
 * tenant-neutral part (`TenantNeutralRequestFeature`), and `scope` runs for every tenant scope the
 * request enters.
 */
export const createTenantScopedChild = (setup: TenantScopedChildSetup): KernelSetup => {
    return async container => {
        await setup.request?.(container);
        TenantNeutralRequestFeature.register(container);
        container.registerInstance(TenantScopeRegistration, {
            register: async scope => {
                await setup.scope(scope);
            }
        });
    };
};
