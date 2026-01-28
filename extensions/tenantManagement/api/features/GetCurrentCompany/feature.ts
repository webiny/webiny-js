import { createFeature } from "@webiny/feature/api";
import GetCurrentCompanyUseCase from "./GetCurrentCompanyUseCase.js";

export const GetCurrentCompanyFeature = createFeature({
    name: "GetCurrentCompany",
    register(container) {
        // Register use case (transient scope)
        container.register(GetCurrentCompanyUseCase);
    }
});
