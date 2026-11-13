import { createFeature } from "@webiny/feature/api";
import UpdateTenantUseCase from "./UpdateTenantUseCase.js";
import UpdateTenantRepository from "./UpdateTenantRepository.js";

export const UpdateTenantFeature = createFeature({
    name: "UpdateTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(UpdateTenantUseCase);

        // Register repository (singleton scope)
        container.register(UpdateTenantRepository).inSingletonScope();
    }
});
