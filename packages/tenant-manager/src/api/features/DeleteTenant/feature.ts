import { createFeature } from "@webiny/feature/api";
import DeleteTenantUseCase from "./DeleteTenantUseCase.js";

export const DeleteTenantFeature = createFeature({
    name: "TenantManagerDeleteTenant",
    register(container) {
        container.register(DeleteTenantUseCase);
    }
});
