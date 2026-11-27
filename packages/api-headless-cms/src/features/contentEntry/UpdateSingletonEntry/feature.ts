import { createFeature } from "@webiny/feature/api";
import { UpdateSingletonEntryUseCase } from "./UpdateSingletonEntryUseCase.js";

/**
 * UpdateSingletonEntry Feature
 *
 * Provides functionality for updating singleton entry revisions.
 */
export const UpdateSingletonEntryFeature = createFeature({
    name: "UpdateSingletonEntry",
    register(container) {
        // Register use case
        container.register(UpdateSingletonEntryUseCase);
    }
});
