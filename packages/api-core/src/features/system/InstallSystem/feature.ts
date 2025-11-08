import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { InstallSystemUseCase } from "./InstallSystemUseCase.js";

export const InstallSystemFeature = createFeature({
    name: "InstallSystem",
    register(container: Container) {
        // Register use case (transient) - auto-wired with DI
        // Depends on EventPublisher, InstallTenantUseCase, GetRootTenantUseCase, and CreateTenantUseCase
        container.register(InstallSystemUseCase);
    }
});
