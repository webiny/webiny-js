import { createFeature } from "@webiny/feature/api";
import { DeleteUserUseCase } from "./DeleteUserUseCase.js";

export const DeleteUserFeature = createFeature({
    name: "DeleteUserFeature",
    register(container) {
        container.register(DeleteUserUseCase);
    }
});
