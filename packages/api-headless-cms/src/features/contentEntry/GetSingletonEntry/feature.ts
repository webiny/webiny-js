import { createFeature } from "@webiny/feature/api";
import { GetSingletonEntryUseCase } from "./GetSingletonEntryUseCase.js";

/**
 * GetSingletonEntry Feature
 *
 * Provides functionality for getting singleton entries.
 * Creates the entry if it doesn't exist.
 */
export const GetSingletonEntryFeature = createFeature({
    name: "GetSingletonEntry",
    register(container) {
        // Register use case
        container.register(GetSingletonEntryUseCase);
    }
});
