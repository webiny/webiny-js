import { createFeature } from "@webiny/feature/api";
import UpdateCompanyUseCase from "./UpdateCompanyUseCase.js";
import UpdateCompanyRepository from "./UpdateCompanyRepository.js";

export const UpdateCompanyFeature = createFeature({
    name: "UpdateCompany",
    register(container) {
        // Register use case (transient scope)
        container.register(UpdateCompanyUseCase);

        // Register repository (singleton scope)
        container.register(UpdateCompanyRepository).inSingletonScope();
    }
});
