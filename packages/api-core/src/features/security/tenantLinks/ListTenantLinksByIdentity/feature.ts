import { createFeature } from "@webiny/feature/api";
import { ListTenantLinksByIdentityUseCaseImpl } from "./ListTenantLinksByIdentityUseCase.js";

export const ListTenantLinksByIdentityFeature = createFeature({
    name: "ListTenantLinksByIdentity",
    register(container) {
        container.register(ListTenantLinksByIdentityUseCaseImpl);
    }
});
