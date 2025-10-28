import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { GetRootTenantUseCase } from "./GetRootTenantUseCase.js";

export const GetRootTenantFeature = createFeature({
    name: "GetRootTenant",
    register(container: Container) {
        container.register(GetRootTenantUseCase);
    }
});
