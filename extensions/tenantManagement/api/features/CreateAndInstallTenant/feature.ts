import { createFeature } from "webiny/api";
import CreateAndInstallTenantUseCase from "./CreateAndInstallTenantUseCase.js";

export const CreateAndInstallTenantFeature = createFeature({
    name: "CreateAndInstallTenant",
    register(container) {
        // Register use case (transient scope)
        container.register(CreateAndInstallTenantUseCase);
    }
});
