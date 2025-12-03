import { createFeature } from "@webiny/feature/api";
import { DeleteTenantLinksUseCaseImpl } from "./DeleteTenantLinksUseCase.js";

export const DeleteTenantLinksFeature = createFeature({
    name: "DeleteTenantLinks",
    register(container) {
        container.register(DeleteTenantLinksUseCaseImpl);
    }
});
