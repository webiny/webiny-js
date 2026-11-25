import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { TenantScopes } from "./TenantScopes.js";
import { TenantScopeUsage } from "./TenantScopeUsage.js";
import { TenantScopeChainRunnerDecorator } from "./TenantScopeChainRunnerDecorator.js";
import { BackgroundTaskTenantSource } from "./BackgroundTaskTenantSource.js";
import { ScheduledActionTenantSource } from "./ScheduledActionTenantSource.js";
import { TenantRegistryFeature } from "~/features/tenancy/TenancyFeature.js";
import { TenantNeutralRequestContextFeature } from "~/features/requestContext/feature.js";import { TenancyStorageOperationsProvider } from "~/features/storageOperations/abstractions.js";
import { DefaultTenancyStorageOperationsProvider } from "~/features/storageOperations/TenancyStorageOperationsProvider.js";

/**
 * Root part of tenant scopes: every event's handler chain runs in its tenant's scope, and the tenant
 * of background tasks and scheduled actions comes from their payload. Each transport registers an
 * `InputTenantSource` for its own events next to it (the `x-tenant` header of an HTTP request).
 */
export const TenantScopesRootFeature = createFeature({
    name: "TenantScopesRoot",
    register(container: Container) {
        container.registerDecorator(TenantScopeChainRunnerDecorator);
        container.register(BackgroundTaskTenantSource);
        container.register(ScheduledActionTenantSource);
    }
});

/**
 * The tenant-neutral part of a request, for the request container: the raw request values (tenant
 * id, token, assume-permissions), the tenant registry the request's tenant is loaded from, and
 * `TenantScopes` with its usage reporter. Everything tenant-specific registers in each tenant scope,
 * through `TenantScopeRegistration`. `TenantScopes` reads its cache size from the build params,
 * which the root holds (they come from the deploy, not the request).
 */
export const TenantNeutralRequestFeature = createFeature({
    name: "TenantNeutralRequest",
    register(container: Container) {
        container.register(DefaultTenancyStorageOperationsProvider);
        const tenancyStorageOperations = container
            .resolve(TenancyStorageOperationsProvider)
            .create();
        TenantRegistryFeature.register(container, tenancyStorageOperations);
        TenantNeutralRequestContextFeature.register(container);
        container.register(TenantScopeUsage).inSingletonScope();
        container.register(TenantScopes).inSingletonScope();
    }
});
