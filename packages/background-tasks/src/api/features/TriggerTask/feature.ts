import { createFeature } from "@webiny/feature/api";
import { TriggerTaskUseCase } from "./abstractions.js";
import { TriggerTaskUseCaseImpl } from "~/api/features/TriggerTask/TriggerTaskUseCase.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export const TriggerTaskFeature = createFeature({
    name: "TriggerTask",
    register(container) {
        container.registerFactory(TriggerTaskUseCase, () => {
            return new TriggerTaskUseCaseImpl(container.resolve(TaskService));
        });
    }
});
