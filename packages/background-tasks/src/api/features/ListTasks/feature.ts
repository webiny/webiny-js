import { createFeature } from "@webiny/feature/api";
import { ListTasksUseCaseImpl } from "./ListTasksUseCase.js";
import { ListTasksUseCase } from "./abstractions.js";
import { TasksCrud } from "~/api/TasksCrud.js";

export const ListTasksFeature = createFeature({
    name: "ListTasks",
    register(container) {
        container.registerFactory(ListTasksUseCase, () => {
            return new ListTasksUseCaseImpl(container.resolve(TasksCrud));
        });
    }
});
