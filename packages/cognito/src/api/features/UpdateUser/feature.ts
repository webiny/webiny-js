import { createFeature } from "@webiny/feature/api";
import { UpdateUserUseCase } from "./UpdateUserUseCase.js";

export const UpdateUserFeature = createFeature({
    name: "UpdateUserFeature",
    register(container) {
        container.register(UpdateUserUseCase);
    }
});
