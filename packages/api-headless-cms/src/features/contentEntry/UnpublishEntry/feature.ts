import { createFeature } from "@webiny/feature/api";
import { UnpublishEntryUseCase } from "./UnpublishEntryUseCase.js";
import { UnpublishEntryRepository } from "./UnpublishEntryRepository.js";

/**
 * UnpublishEntry Feature
 *
 * Provides complete functionality for unpublishing content entries:
 * - Use case for orchestration
 * - Repository for persistence
 * - Events for extensibility
 */
export const UnpublishEntryFeature = createFeature({
    name: "UnpublishEntry",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(UnpublishEntryUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(UnpublishEntryRepository).inSingletonScope();
    }
});
