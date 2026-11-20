import { createFeature } from "@webiny/feature/api";
import CreateTenantUseCase from "./CreateTenantUseCase.js";
import CreateTenantRepository from "./CreateTenantRepository.js";
import CheckTenantIdOnEntryBeforeCreateHandler from "./CheckTenantIdOnEntryBeforeCreateHandler.js";

export const CreateTenantFeature = createFeature({
    name: "CreateTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(CreateTenantUseCase);

        // Register repository (singleton scope)
        container.register(CreateTenantRepository).inSingletonScope();

        // Refuse tenant entries for tenants that already exist
        container.register(CheckTenantIdOnEntryBeforeCreateHandler);
    }
});
