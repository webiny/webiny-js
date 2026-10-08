import { createFeature } from "@webiny/feature/admin";
import { SaveDashboardLayoutUseCase } from "./SaveDashboardLayoutUseCase.js";

export const SaveDashboardLayoutFeature = createFeature({
    name: "AdminUI/SaveDashboardLayout",
    register(container) {
        container.register(SaveDashboardLayoutUseCase);
    }
});
