import { Container } from "@webiny/di";
import { createFeature } from "@webiny/feature/admin";
import { LocalStorageFeature } from "@webiny/app/features/localStorage/feature.js";
import { TenantContext as TenantContextAbstraction } from "./abstractions.js";
import { TenantContext } from "./TenantContext.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";

export const TenancyFeature = createFeature({
    name: "Tenancy",
    register(container: Container) {
        container.register(TenantContext).inSingletonScope();
        container.registerDecorator(GraphQLClientDecorator);
    },
    resolve(container: Container) {
        const service = container.resolve(TenantContextAbstraction);

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
