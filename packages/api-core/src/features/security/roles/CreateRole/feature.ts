import { createFeature } from "@webiny/feature/api";
import { CreateRoleUseCase } from "./CreateRoleUseCase.js";

export const CreateRoleFeature = createFeature({
    name: "CreateRole",
    register(container) {
        container.register(CreateRoleUseCase);
    }
});
