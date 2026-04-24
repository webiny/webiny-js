import { createFeature } from "@webiny/feature/api";
import { CreateGroupUseCase } from "./CreateGroupUseCase.js";
import { CreateGroupRepository } from "./CreateGroupRepository.js";

/**
 * CreateGroup Feature
 *
 * Provides functionality for creating new content model groups.
 * Includes validation, slug generation, and plugin conflict checks.
 */
export const CreateGroupFeature = createFeature({
    name: "CreateGroup",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(CreateGroupUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(CreateGroupRepository).inSingletonScope();
    }
});
