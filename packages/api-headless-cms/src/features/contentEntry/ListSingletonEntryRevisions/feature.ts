import { createFeature } from "@webiny/feature/api";
import { ListSingletonEntryRevisionsUseCase } from "./ListSingletonEntryRevisionsUseCase.js";

/**
 * ListSingletonEntryRevisions Feature
 *
 * Lists the revisions of the singleton entry.
 */
export const ListSingletonEntryRevisionsFeature = createFeature({
    name: "ListSingletonEntryRevisions",
    register(container) {
        container.register(ListSingletonEntryRevisionsUseCase);
    }
});
