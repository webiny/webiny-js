import { createFeature } from "@webiny/feature/api";
import { ListVisibleTasksUseCase } from "./ListVisibleTasksUseCase.js";

export const ListVisibleTasksFeature = createFeature({
    name: "ListVisibleTasks",
    register(container) {
        container.register(ListVisibleTasksUseCase);
    }
});
