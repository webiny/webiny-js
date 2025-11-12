import { createFeature } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "./DeleteEntryRevisionUseCase.js";
import { DeleteEntryRevisionRepository } from "./DeleteEntryRevisionRepository.js";

export const DeleteEntryRevisionFeature = createFeature({
    name: "DeleteEntryRevision",
    register(container) {
        // Register repository (singleton scope)
        container.register(DeleteEntryRevisionRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(DeleteEntryRevisionUseCase);
    }
});
