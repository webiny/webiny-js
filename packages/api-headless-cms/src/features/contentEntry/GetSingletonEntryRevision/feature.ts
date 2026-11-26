import { createFeature } from "@webiny/feature/api";
import { GetSingletonEntryRevisionUseCase } from "./GetSingletonEntryRevisionUseCase.js";

/**
 * GetSingletonEntryRevision Feature
 *
 * Gets a revision of the singleton entry.
 */
export const GetSingletonEntryRevisionFeature = createFeature({
    name: "GetSingletonEntryRevision",
    register(container) {
        container.register(GetSingletonEntryRevisionUseCase);
    }
});
