import { createFeature } from "@webiny/feature/api";
import { ListDashboardsUseCase } from "./ListDashboardsUseCase.js";
import { ListDashboardsRepository } from "./ListDashboardsRepository.js";

export const ListDashboardsFeature = createFeature({
    name: "ListDashboards",
    register(container) {
        container.register(ListDashboardsUseCase);
        container.register(ListDashboardsRepository).inSingletonScope();
    }
});
