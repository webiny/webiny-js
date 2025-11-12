import { createFeature } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "./UpdateEntryUseCase.js";
import { UpdateEntryRepository } from "./UpdateEntryRepository.js";

/**
 * UpdateEntry Feature
 *
 * Provides complete functionality for updating content entries:
 * - Use case for orchestration
 * - Repository for persistence
 * - Events for extensibility
 */
export const UpdateEntryFeature = createFeature({
    name: "UpdateEntry",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(UpdateEntryUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(UpdateEntryRepository).inSingletonScope();
    }
});
