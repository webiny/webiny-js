import { createFeature } from "@webiny/feature/api";
import { GetTenantLinkByIdentityUseCaseImpl } from "./GetTenantLinkByIdentityUseCase.js";

export const GetTenantLinkByIdentityFeature = createFeature({
    name: "GetTenantLinkByIdentity",
    register(container) {
        container.register(GetTenantLinkByIdentityUseCaseImpl);
    }
});
