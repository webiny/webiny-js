import { createFeature } from "@webiny/feature/api";
import { DeleteAdminUserUseCase } from "./DeleteAdminUserUseCase.js";

export const DeleteAdminUserFeature = createFeature({
    name: "DeleteAdminUserFeature",
    register(container) {
        container.register(DeleteAdminUserUseCase);
    }
});
