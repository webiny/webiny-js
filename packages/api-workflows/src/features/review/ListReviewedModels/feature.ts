import { createFeature } from "@webiny/feature/api";
import { ListReviewedModelsUseCase } from "./ListReviewedModelsUseCase.js";

export const ListReviewedModelsFeature = createFeature({
    name: "Workflows/ListReviewedModels",
    register(container) {
        // Caches the namespaces for one request.
        container.register(ListReviewedModelsUseCase).inContainerScope();
    }
});
