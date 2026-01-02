import { createFeature } from "@webiny/feature/api";
import { UpdateModelUseCase } from "./UpdateModelUseCase.js";
import { UpdateModelRepository } from "./UpdateModelRepository.js";

/**
 * UpdateModel Feature
 *
 * Provides functionality for updating existing content models.
 * All validation (API name uniqueness, field validation) is handled by the repository.
 */
export const UpdateModelFeature = createFeature({
    name: "UpdateModel",
    register(container) {
        // Register core use case
        container.register(UpdateModelUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(UpdateModelRepository).inSingletonScope();
    }
});
