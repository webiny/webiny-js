import { createFeature } from "@webiny/feature/api";
import { UpdateTaskLogUseCase } from "./UpdateTaskLogUseCase.js";

export const UpdateTaskLogFeature = createFeature({
    name: "UpdateTaskLog",
    register(container) {
        container.register(UpdateTaskLogUseCase);
    }
});
