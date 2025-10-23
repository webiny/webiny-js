import { createFeature } from "@webiny/feature/api";
import { ListTenantLinksByTenantUseCaseImpl } from "./ListTenantLinksByTenantUseCase.js";

export const ListTenantLinksByTenantFeature = createFeature({
    name: "ListTenantLinksByTenant",
    register(container) {
        container.register(ListTenantLinksByTenantUseCaseImpl);
    }
});
