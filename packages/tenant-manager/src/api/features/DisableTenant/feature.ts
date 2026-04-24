import { createFeature } from "@webiny/feature/api";
import DisableTenantUseCase from "./DisableTenantUseCase.js";

export const DisableTenantFeature = createFeature({
    name: "DisableTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(DisableTenantUseCase);
    }
});
