import { createFeature } from "@webiny/feature/api";
import { CreateTaskLogUseCase } from "./CreateTaskLogUseCase.js";

export const CreateTaskLogFeature = createFeature({
    name: "CreateTaskLog",
    register(container) {
        container.register(CreateTaskLogUseCase);
    }
});
