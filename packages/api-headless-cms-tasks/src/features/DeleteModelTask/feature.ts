import { createFeature } from "@webiny/feature/api";
import { DeleteModelTask } from "./DeleteModelTask.js";

export const DeleteModelTaskFeature = createFeature({
    name: "HeadlessCms/Tasks/DeleteModelTask",
    register(container) {
        container.register(DeleteModelTask);
    }
});
