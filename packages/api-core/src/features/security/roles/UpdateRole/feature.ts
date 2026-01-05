import { createFeature } from "@webiny/feature/api";
import { UpdateRoleUseCaseImpl } from "./UpdateRoleUseCase.js";

export const UpdateRoleFeature = createFeature({
    name: "UpdateRole",
    register(container) {
        container.register(UpdateRoleUseCaseImpl);
    }
});
