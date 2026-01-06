import { createFeature } from "@webiny/feature/api";
import { DeleteRoleUseCase } from "./DeleteRoleUseCase.js";

export const DeleteRoleFeature = createFeature({
    name: "DeleteRole",
    register(container) {
        container.register(DeleteRoleUseCase);
    }
});
