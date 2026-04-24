import { createFeature } from "@webiny/feature/api";
import { GetGroupUseCase } from "./GetGroupUseCase.js";
import { GetGroupRepository } from "./GetGroupRepository.js";

/**
 * GetGroup Feature
 *
 * Provides functionality for retrieving a single content model group by ID.
 * Uses GroupCache (registered elsewhere) for fetching groups.
 */
export const GetGroupFeature = createFeature({
    name: "GetGroup",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(GetGroupUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(GetGroupRepository).inSingletonScope();
    }
});
