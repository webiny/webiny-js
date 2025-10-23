import { createFeature } from "@webiny/feature/api";
import { ListTenantLinksByTypeUseCaseImpl } from "./ListTenantLinksByTypeUseCase.js";

export const ListTenantLinksByTypeFeature = createFeature({
    name: "ListTenantLinksByType",
    register(container) {
        container.register(ListTenantLinksByTypeUseCaseImpl);
    }
});
