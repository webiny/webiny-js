import { createFeature } from "@webiny/feature/api";
import { DeleteSingletonEntryRevisionUseCase } from "./DeleteSingletonEntryRevisionUseCase.js";

/**
 * DeleteSingletonEntryRevision Feature
 *
 * Deletes a singleton entry revision.
 */
export const DeleteSingletonEntryRevisionFeature = createFeature({
    name: "DeleteSingletonEntryRevision",
    register(container) {
        container.register(DeleteSingletonEntryRevisionUseCase);
    }
});
