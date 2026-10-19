import { createFeature } from "@webiny/feature/api";
import { UpdateTaskUseCase } from "./UpdateTaskUseCase.js";

export const UpdateTaskFeature = createFeature({
    name: "UpdateTask",
    register(container) {
        container.register(UpdateTaskUseCase);
    }
});
