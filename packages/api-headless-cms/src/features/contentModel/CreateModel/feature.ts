import { createFeature } from "@webiny/feature/api";
import { CreateModelUseCase } from "./CreateModelUseCase.js";
import { CreateModelRepository } from "./CreateModelRepository.js";

/**
 * CreateModel Feature
 *
 * Provides functionality for creating new content models.
 * Includes validation, API name uniqueness checks, and plugin conflict checks.
 */
export const CreateModelFeature = createFeature({
    name: "CreateModel",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(CreateModelUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(CreateModelRepository).inSingletonScope();
    }
});
