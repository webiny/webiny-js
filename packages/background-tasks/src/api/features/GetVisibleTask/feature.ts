import { createFeature } from "@webiny/feature/api";
import { GetVisibleTaskUseCase } from "./GetVisibleTaskUseCase.js";

export const GetVisibleTaskFeature = createFeature({
    name: "GetVisibleTask",
    register(container) {
        container.register(GetVisibleTaskUseCase);
    }
});
