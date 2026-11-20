import { createFeature } from "@webiny/feature/api";
import { CanAccessCurrentTenantUseCase } from "./CanAccessCurrentTenantUseCase.js";

export const CanAccessCurrentTenantFeature = createFeature({
    name: "CanAccessCurrentTenant",
    register(container) {
        container.register(CanAccessCurrentTenantUseCase);
    }
});
