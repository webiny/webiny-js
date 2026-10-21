import { createFeature } from "@webiny/feature/api";
import { UpdateCurrentAdminUserUseCase } from "./UpdateCurrentAdminUserUseCase.js";

export const UpdateCurrentAdminUserFeature = createFeature({
    name: "UpdateCurrentAdminUserFeature",
    register(container) {
        container.register(UpdateCurrentAdminUserUseCase);
    }
});
