import { createFeature } from "@webiny/feature/api";
import { ListTasksUseCase } from "./ListTasksUseCase.js";

export const ListTasksFeature = createFeature({
    name: "ListTasks",
    register(container) {
        container.register(ListTasksUseCase);
    }
});
