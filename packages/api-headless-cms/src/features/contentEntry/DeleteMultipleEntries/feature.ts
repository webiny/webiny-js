import { createFeature } from "@webiny/feature/api";
import { DeleteMultipleEntriesUseCase } from "./DeleteMultipleEntriesUseCase.js";
import { DeleteMultipleEntriesRepository } from "./DeleteMultipleEntriesRepository.js";

export const DeleteMultipleEntriesFeature = createFeature({
    name: "DeleteMultipleEntries",
    register(container) {
        // Register repository (singleton scope)
        container.register(DeleteMultipleEntriesRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(DeleteMultipleEntriesUseCase);
    }
});
