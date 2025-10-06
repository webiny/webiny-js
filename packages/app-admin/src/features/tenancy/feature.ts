import { Container } from "@webiny/di-container";
import { createFeature } from "@webiny/app";
import { TenancyService as TenancyServiceAbstraction } from "./abstractions";
import { TenancyService } from "./TenancyService";
import { LocalStorageFeature } from "@webiny/app/features/localStorage";

export const TenancyFeature = createFeature({
    name: "Tenancy",
    register(container: Container) {
        container.register(TenancyService).inSingletonScope();
    },
    resolve(container: Container) {
        const service = container.resolve(TenancyServiceAbstraction);

        return {
            service,

            // Helper to create tenant-scoped container
            createTenantContainer: () => {
                const currentTenant = service.getCurrentTenant();

                if (!currentTenant) {
                    return container;
                }

                // Get current localStorage config
                const { localStorageConfig } = LocalStorageFeature.resolve(container);

                // Create tenant-scoped child container
                const tenantContainer = container.createChildContainer();

                // Re-register localStorage with tenant-specific prefix
                LocalStorageFeature.register(tenantContainer, {
                    prefix: `${localStorageConfig.prefix}/${currentTenant}`
                });

                return tenantContainer;
            }
        };
    }
});
