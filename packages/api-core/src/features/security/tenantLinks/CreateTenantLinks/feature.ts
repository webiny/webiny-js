import { createFeature } from "@webiny/feature/api";
import { CreateTenantLinksUseCaseImpl } from "./CreateTenantLinksUseCase.js";

export const CreateTenantLinksFeature = createFeature({
    name: "CreateTenantLinks",
    register(container) {
        container.register(CreateTenantLinksUseCaseImpl);
    }
});
