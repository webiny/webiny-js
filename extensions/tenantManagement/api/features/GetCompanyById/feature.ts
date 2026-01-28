import { createFeature } from "@webiny/feature/api";
import GetCompanyByIdUseCase from "./GetCompanyByIdUseCase.js";
import GetCompanyByIdRepository from "./GetCompanyByIdRepository.js";

export const GetCompanyByIdFeature = createFeature({
    name: "GetCompanyById",
    register(container) {
        // Register use case (transient scope)
        container.register(GetCompanyByIdUseCase);

        // Register repository (singleton scope)
        container.register(GetCompanyByIdRepository).inSingletonScope();
    }
});
