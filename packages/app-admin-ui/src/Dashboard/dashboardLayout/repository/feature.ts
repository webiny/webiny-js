import { createFeature } from "@webiny/feature/admin";
import { DashboardLayoutGateway } from "./DashboardLayoutGateway.js";
import { DashboardLayoutRepository } from "./DashboardLayoutRepository.js";

export const DashboardLayoutRepositoryFeature = createFeature({
    name: "AdminUI/DashboardLayoutRepository",
    register(container) {
        container.register(DashboardLayoutGateway).inSingletonScope();
        container.register(DashboardLayoutRepository).inSingletonScope();
    }
});
