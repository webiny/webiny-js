import { createFeature } from "@webiny/feature/api";
import { GetMyDashboardUseCase } from "./GetMyDashboardUseCase.js";
import { GetMyDashboardRepository } from "./GetMyDashboardRepository.js";

export const GetMyDashboardFeature = createFeature({
    name: "GetMyDashboard",
    register(container) {
        container.register(GetMyDashboardUseCase);
        container.register(GetMyDashboardRepository).inSingletonScope();
    }
});
