import { createFeature } from "@webiny/feature/admin";
import { GetCachedDashboardLayoutUseCase } from "./GetCachedDashboardLayoutUseCase.js";
import { FetchDashboardLayoutUseCase } from "./FetchDashboardLayoutUseCase.js";

export const LoadDashboardLayoutFeature = createFeature({
    name: "AdminUI/LoadDashboardLayout",
    register(container) {
        container.register(GetCachedDashboardLayoutUseCase);
        container.register(FetchDashboardLayoutUseCase);
    }
});
