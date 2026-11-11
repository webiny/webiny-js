import { createFeature } from "@webiny/feature/api";
import { UpdateAdminUserUseCase } from "./UpdateAdminUserUseCase.js";

export const UpdateAdminUserFeature = createFeature({
    name: "UpdateAdminUserFeature",
    register(container) {
        container.register(UpdateAdminUserUseCase);
    }
});
