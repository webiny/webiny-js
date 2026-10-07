import { createFeature } from "@webiny/feature/api";
import { SaveMyDashboardUseCase } from "./SaveMyDashboardUseCase.js";
import { SaveMyDashboardRepository } from "./SaveMyDashboardRepository.js";

export const SaveMyDashboardFeature = createFeature({
    name: "SaveMyDashboard",
    register(container) {
        container.register(SaveMyDashboardUseCase);
        container.register(SaveMyDashboardRepository).inSingletonScope();
    }
});
