import { createFeature } from "@webiny/feature/api";
import { DeleteTaskUseCase } from "./DeleteTaskUseCase.js";

export const DeleteTaskFeature = createFeature({
    name: "DeleteTask",
    register(container) {
        container.register(DeleteTaskUseCase);
    }
});
