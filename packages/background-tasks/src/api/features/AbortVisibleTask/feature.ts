import { createFeature } from "@webiny/feature/api";
import { AbortVisibleTaskUseCase } from "./AbortVisibleTaskUseCase.js";

export const AbortVisibleTaskFeature = createFeature({
    name: "AbortVisibleTask",
    register(container) {
        container.register(AbortVisibleTaskUseCase);
    }
});
