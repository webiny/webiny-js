import { createFeature } from "@webiny/feature/api";
import { DeleteVisibleTaskUseCase } from "./DeleteVisibleTaskUseCase.js";

export const DeleteVisibleTaskFeature = createFeature({
    name: "DeleteVisibleTask",
    register(container) {
        container.register(DeleteVisibleTaskUseCase);
    }
});
