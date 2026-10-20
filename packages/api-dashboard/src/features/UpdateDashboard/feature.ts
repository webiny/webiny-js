import { createFeature } from "@webiny/feature/api";
import { UpdateDashboardUseCase } from "./UpdateDashboardUseCase.js";
import { UpdateDashboardRepository } from "./UpdateDashboardRepository.js";

export const UpdateDashboardFeature = createFeature({
    name: "UpdateDashboard",
    register(container) {
        container.register(UpdateDashboardUseCase);
        container.register(UpdateDashboardRepository).inSingletonScope();
    }
});
