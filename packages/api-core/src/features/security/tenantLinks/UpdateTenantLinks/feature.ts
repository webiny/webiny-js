import { createFeature } from "@webiny/feature/api";
import { UpdateTenantLinksUseCaseImpl } from "./UpdateTenantLinksUseCase.js";

export const UpdateTenantLinksFeature = createFeature({
    name: "UpdateTenantLinks",
    register(container) {
        container.register(UpdateTenantLinksUseCaseImpl);
    }
});
