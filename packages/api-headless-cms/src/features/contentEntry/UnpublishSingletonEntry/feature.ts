import { createFeature } from "@webiny/feature/api";
import { UnpublishSingletonEntryUseCase } from "./UnpublishSingletonEntryUseCase.js";

/**
 * UnpublishSingletonEntry Feature
 *
 * Unpublishes a singleton entry revision.
 */
export const UnpublishSingletonEntryFeature = createFeature({
    name: "UnpublishSingletonEntry",
    register(container) {
        container.register(UnpublishSingletonEntryUseCase);
    }
});
