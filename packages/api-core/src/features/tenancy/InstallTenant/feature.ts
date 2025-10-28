import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { InstallTenantUseCase } from "./InstallTenantUseCase.js";

export const InstallTenantFeature = createFeature({
    name: "InstallTenant",
    register(container: Container) {
        container.register(InstallTenantUseCase);
    }
});
