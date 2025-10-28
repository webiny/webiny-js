import { createFeature } from "@webiny/feature/api/index.js";
import type { TenancyStorageOperations as ITenancyStorageOperations } from "~/types/tenancy.js";
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

export const TenancyFeature = createFeature({
    name: "TenancyFeature",
    register: (container, storageOperations: ITenancyStorageOperations) => {
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
    }
});
