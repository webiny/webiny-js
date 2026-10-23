import { createFeature } from "@webiny/feature/api";
import { ResolveIdentityTenantsUseCase } from "./ResolveIdentityTenantsUseCase.js";

export const ResolveIdentityTenantsFeature = createFeature({
    name: "ResolveIdentityTenants",
    register(container) {
        container.register(ResolveIdentityTenantsUseCase);
    }
});
