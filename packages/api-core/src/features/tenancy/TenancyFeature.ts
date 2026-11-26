import { createFeature } from "@webiny/feature/api";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "~/types/tenancy.js";
import { TenantCache } from "./shared/abstractions.js";
import { TenantCache as TenantCacheImpl } from "./shared/TenantCache.js";
import { TenancyStorageOperations } from "./shared/storageOperations.js";
import { GetRootTenantFeature } from "./GetRootTenant/feature.js";
import { ListTenantsFeature } from "./ListTenants/feature.js";
import { CreateTenantFeature } from "./CreateTenant/feature.js";
import { UpdateTenantFeature } from "./UpdateTenant/feature.js";
import { DeleteTenantFeature } from "./DeleteTenant/feature.js";
import { GetTenantByIdFeature } from "./GetTenantById/feature.js";
import { TenantContextFeature } from "./TenantContext/feature.js";
import { InstallTenantFeature } from "./InstallTenant/index.js";

/**
 * The tenant registry: the tenant records' storage, the request's tenant cache, and reading a tenant
 * by id (`GetTenantById`, `GetRootTenant`). Tenant-neutral: the request container registers it, so
 * the request's tenant can be loaded before any tenant scope exists, and every scope of the request
 * shares it (one cache, cleared by whichever scope changes a tenant).
 */
export const TenantRegistryFeature = createFeature<ITenancyStorageOperations>({
    name: "TenantRegistryFeature",
    register: (container, storageOperations) => {
        container.registerInstance(TenancyStorageOperations, storageOperations);

        container.registerInstance(
            TenantCache,
            new TenantCacheImpl(async (ids: readonly string[]) => {
                if (ids.length === 0) {
                    return [];
                }
                const tenants = await storageOperations.getTenantsByIds(ids);
                /* Storage may skip missing tenants (or leave an empty slot for them) and doesn't
                   keep the order, so match by ID. */
                return ids.map(id => tenants.find(tenant => tenant?.id === id) as Tenant);
            })
        );

        GetRootTenantFeature.register(container);
        GetTenantByIdFeature.register(container);
    }
});

/**
 * What a tenant scope adds to the registry: its `TenantContext`, and creating, changing, listing and
 * installing tenants. They run on the registry of the request (its storage and cache).
 */
export const TenantScopeTenancyFeature = createFeature({
    name: "TenantScopeTenancyFeature",
    register: container => {
        CreateTenantFeature.register(container);
        DeleteTenantFeature.register(container);
        ListTenantsFeature.register(container);
        UpdateTenantFeature.register(container);
        TenantContextFeature.register(container);
        InstallTenantFeature.register(container);
    }
});

/** The registry and the tenant scope's part, in one container. */
export const TenancyFeature = createFeature<ITenancyStorageOperations>({
    name: "TenancyFeature",
    register: (container, storageOperations) => {
        TenantRegistryFeature.register(container, storageOperations);
        TenantScopeTenancyFeature.register(container);
    }
});
