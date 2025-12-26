import { createFeature } from "@webiny/feature/api";
import { ListModelsUseCase } from "./ListModelsUseCase.js";
import { ListModelsRepository } from "./ListModelsRepository.js";

/**
 * ListModels Feature
 *
 * Provides functionality for retrieving all content models.
 * Includes caching, plugin model support, access control filtering,
 * and options to include/exclude private models and plugin models.
 */
export const ListModelsFeature = createFeature({
    name: "ListModels",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(ListModelsUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(ListModelsRepository).inSingletonScope();
    }
});
