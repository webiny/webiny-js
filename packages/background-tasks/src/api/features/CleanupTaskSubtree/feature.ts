import { createFeature } from "@webiny/feature/api";
import { CleanupTaskSubtreeUseCase } from "./CleanupTaskSubtreeUseCase.js";

export const CleanupTaskSubtreeFeature = createFeature({
    name: "CleanupTaskSubtree",
    register(container) {
        container.register(CleanupTaskSubtreeUseCase);
    }
});
