import { createFeature } from "webiny/api";
import GetTenantByIdUseCase from "./GetTenantByIdUseCase.js";
import GetTenantByIdRepository from "./GetTenantByIdRepository.js";

export const GetTenantByIdFeature = createFeature({
    name: "GetTenantById",
    register(container) {
        // Register use case (transient scope)
        container.register(GetTenantByIdUseCase);

        // Register repository (singleton scope)
        container.register(GetTenantByIdRepository).inSingletonScope();
    }
});
