import { createFeature } from "@webiny/feature/admin";
import { SaveDashboardLayoutGateway } from "./SaveDashboardLayoutGateway.js";
import { SaveDashboardLayoutUseCase } from "./SaveDashboardLayoutUseCase.js";

export const SaveDashboardLayoutFeature = createFeature({
    name: "AdminUI/SaveDashboardLayout",
    register(container) {
        container.register(SaveDashboardLayoutGateway).inSingletonScope();
        container.register(SaveDashboardLayoutUseCase);
    }
});
