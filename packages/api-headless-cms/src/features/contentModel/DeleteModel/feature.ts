import { createFeature } from "@webiny/feature/api";
import { DeleteModelUseCase } from "./DeleteModelUseCase.js";
import { DeleteModelRepository } from "./DeleteModelRepository.js";
import { DeleteModelWithEntryCleanup } from "./DeleteModelWithEntryCleanup.js";

/**
 * DeleteModel Feature
 *
 * Provides functionality for deleting content models.
 * Includes entry cleanup for singleton models and validation for regular models.
 */
export const DeleteModelFeature = createFeature({
    name: "DeleteModel",
    register(container) {
        // Register core use case
        container.register(DeleteModelUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(DeleteModelRepository).inSingletonScope();

        // Register entry cleanup decorator
        container.registerDecorator(DeleteModelWithEntryCleanup);
    }
});
