import { createFeature } from "@webiny/feature/api";
import { UpdateSingletonEntryUseCase } from "./UpdateSingletonEntryUseCase.js";

/**
 * UpdateSingletonEntry Feature
 *
 * Provides functionality for updating singleton entries.
 * Gets the entry (creating if needed) then updates it.
 */
export const UpdateSingletonEntryFeature = createFeature({
    name: "UpdateSingletonEntry",
    register(container) {
        // Register use case
        container.register(UpdateSingletonEntryUseCase);
    }
});
