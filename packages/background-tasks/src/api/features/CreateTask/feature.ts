import { createFeature } from "@webiny/feature/api";
import { CreateTaskUseCase } from "./CreateTaskUseCase.js";

export const CreateTaskFeature = createFeature({
    name: "CreateTask",
    register(container) {
        container.register(CreateTaskUseCase);
    }
});
