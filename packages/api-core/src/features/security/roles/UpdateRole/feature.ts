import { createFeature } from "@webiny/feature/api";
import { UpdateRoleUseCase } from "./UpdateRoleUseCase.js";

export const UpdateRoleFeature = createFeature({
    name: "UpdateRole",
    register(container) {
        container.register(UpdateRoleUseCase);
    }
});
