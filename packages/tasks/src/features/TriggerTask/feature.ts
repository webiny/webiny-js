import { createFeature } from "@webiny/feature/api";
import { TriggerTaskUseCase } from "./TriggerTaskUseCase.js";
import { TriggerTaskRepository } from "./TriggerTaskRepository.js";

export const TriggerTaskFeature = createFeature({
    name: "TriggerTask",
    register(container) {
        container.register(TriggerTaskRepository);
        container.register(TriggerTaskUseCase);
    }
});
