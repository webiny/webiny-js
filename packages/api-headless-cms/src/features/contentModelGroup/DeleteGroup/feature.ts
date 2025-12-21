import { createFeature } from "@webiny/feature/api";
import { DeleteGroupUseCase } from "./DeleteGroupUseCase.js";
import { DeleteGroupRepository } from "./DeleteGroupRepository.js";

/**
 * DeleteGroup Feature
 *
 * Provides functionality for deleting content model groups.
 * Prevents deletion of plugin-based groups and groups with models.
 */
export const DeleteGroupFeature = createFeature({
    name: "DeleteGroup",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(DeleteGroupUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(DeleteGroupRepository).inSingletonScope();
    }
});
