import { createFeature } from "@webiny/feature/api";
import { AbortTaskUseCaseImpl } from "./AbortTaskUseCase.js";
import { AbortTaskUseCase } from "./abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export const AbortTaskFeature = createFeature({
    name: "AbortTask",
    register(container) {
        container.registerFactory(AbortTaskUseCase, () => {
            return new AbortTaskUseCaseImpl(container.resolve(TaskService));
        });
    }
});
