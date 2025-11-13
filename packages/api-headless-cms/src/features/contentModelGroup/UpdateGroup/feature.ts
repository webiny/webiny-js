import { createFeature } from "@webiny/feature/api";
import { UpdateGroupUseCase } from "./UpdateGroupUseCase.js";
import { UpdateGroupRepository } from "./UpdateGroupRepository.js";

/**
 * UpdateGroup Feature
 *
 * Provides functionality for updating existing content model groups.
 * Prevents updates to plugin-based groups.
 */
export const UpdateGroupFeature = createFeature({
    name: "UpdateGroup",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(UpdateGroupUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(UpdateGroupRepository).inSingletonScope();
    }
});
