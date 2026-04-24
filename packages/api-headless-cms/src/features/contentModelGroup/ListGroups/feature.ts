import { createFeature } from "@webiny/feature/api";
import { ListGroupsUseCase } from "./ListGroupsUseCase.js";
import { ListGroupsRepository } from "./ListGroupsRepository.js";

/**
 * ListGroups Feature
 *
 * Provides functionality for retrieving all content model groups.
 * Uses GroupCache (registered elsewhere) for fetching groups.
 */
export const ListGroupsFeature = createFeature({
    name: "ListGroups",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(ListGroupsUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(ListGroupsRepository).inSingletonScope();
    }
});
