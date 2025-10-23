import type { Container } from "@webiny/di-container";
import type { TenancyStorageOperations as ITenancyStorageOperations } from "./types.js";
import { TenantCache } from "./features/shared/abstractions.js";
import { TenantCache as TenantCacheImpl } from "./features/shared/TenantCache.js";
import { TenancyStorageOperations } from "./features/shared/storageOperations.js";
import { GetRootTenantFeature } from "./features/GetRootTenant/feature.js";
import { ListTenantsFeature } from "./features/ListTenants/feature.js";
import { CreateTenantFeature } from "./features/CreateTenant/feature.js";
import { UpdateTenantFeature } from "./features/UpdateTenant/feature.js";
import { DeleteTenantFeature } from "./features/DeleteTenant/feature.js";
import { GetTenantByIdFeature } from "~/features/GetTenantById/feature.js";
import { TenantContextFeature } from "~/features/TenantContext/feature.js";
import { InstallTenantFeature } from "~/features/InstallTenant/index.js";

export const setupFeatures = (
    container: Container,
    storageOperations: ITenancyStorageOperations
) => {
    // Register storage operations abstraction (singleton)
    container.registerInstance(TenancyStorageOperations, storageOperations);

    // Register shared cache (singleton) - batch loader provided here
    container.registerInstance(
        TenantCache,
        new TenantCacheImpl(async (ids: readonly string[]) => {
            if (ids.length === 0) {
                return [];
            }
            const tenants = await storageOperations.getTenantsByIds(ids);
            return ids.map((_, index) => tenants[index]);
        })
    );

    // Register all features - they will auto-wire their dependencies from the container
    CreateTenantFeature.register(container);
    DeleteTenantFeature.register(container);
    GetRootTenantFeature.register(container);
    GetTenantByIdFeature.register(container);
    ListTenantsFeature.register(container);
    UpdateTenantFeature.register(container);
    TenantContextFeature.register(container);
    InstallTenantFeature.register(container);
};
