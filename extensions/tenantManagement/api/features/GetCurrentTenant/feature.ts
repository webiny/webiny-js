import { createFeature } from "webiny/api";
import GetCurrentTenantUseCase from "./GetCurrentTenantUseCase.js";

export const GetCurrentTenantFeature = createFeature({
    name: "GetCurrentTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(GetCurrentTenantUseCase);
    }
});
