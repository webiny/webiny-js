import { createFeature } from "@webiny/feature/api";
import { TriggerVisibleTaskUseCase } from "./TriggerVisibleTaskUseCase.js";

export const TriggerVisibleTaskFeature = createFeature({
    name: "TriggerVisibleTask",
    register(container) {
        container.register(TriggerVisibleTaskUseCase);
    }
});
