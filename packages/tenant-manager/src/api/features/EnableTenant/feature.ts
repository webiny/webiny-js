import { createFeature } from "@webiny/feature/api";
import EnableTenantUseCase from "./EnableTenantUseCase.js";

export const EnableTenantFeature = createFeature({
    name: "EnableTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(EnableTenantUseCase);
    }
});
