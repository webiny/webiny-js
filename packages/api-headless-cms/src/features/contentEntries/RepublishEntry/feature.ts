import { createFeature } from "@webiny/feature/api";
import { RepublishEntryUseCase } from "./RepublishEntryUseCase.js";
import { RepublishEntryRepository } from "./RepublishEntryRepository.js";

export const RepublishEntryFeature = createFeature({
    name: "RepublishEntry",
    register(container) {
        // Register repository (singleton scope)
        container.register(RepublishEntryRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(RepublishEntryUseCase);
    }
});
