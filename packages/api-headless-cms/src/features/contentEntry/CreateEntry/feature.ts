import { createFeature } from "@webiny/feature/api";
import { CreateEntryUseCase } from "./CreateEntryUseCase.js";
import { CreateEntryRepository } from "./CreateEntryRepository.js";

/**
 * CreateEntry Feature
 *
 * Provides complete functionality for creating new content entries:
 * - Use case for orchestration
 * - Repository for persistence
 * - Events for extensibility
 */
export const CreateEntryFeature = createFeature({
    name: "CreateEntry",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(CreateEntryUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(CreateEntryRepository).inSingletonScope();
    }
});
