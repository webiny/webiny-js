import { createFeature } from "@webiny/feature/api";
import { CreateModelUseCase } from "./CreateModelUseCase.js";
import { CreateModelRepository } from "./CreateModelRepository.js";

/**
 * CreateModel Feature
 *
 * Provides functionality for creating new content models.
 * All validation (modelId generation, domain rules, uniqueness) is handled by the repository.
 */
export const CreateModelFeature = createFeature({
    name: "CreateModel",
    register(container) {
        // Register core use case
        container.register(CreateModelUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(CreateModelRepository).inSingletonScope();
    }
});
