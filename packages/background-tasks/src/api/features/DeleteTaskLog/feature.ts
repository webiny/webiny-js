import { createFeature } from "@webiny/feature/api";
import { DeleteTaskLogUseCase } from "./DeleteTaskLogUseCase.js";

export const DeleteTaskLogFeature = createFeature({
    name: "DeleteTaskLog",
    register(container) {
        container.register(DeleteTaskLogUseCase);
    }
});
