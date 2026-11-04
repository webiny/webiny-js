import { createFeature } from "@webiny/feature/api";
import { CreateAdminUserUseCase } from "./CreateAdminUserUseCase.js";

export const CreateAdminUserFeature = createFeature({
    name: "CreateAdminUserFeature",
    register(container) {
        container.register(CreateAdminUserUseCase);
    }
});
