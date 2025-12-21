import { createFeature } from "@webiny/feature/api";
import { PublishEntryUseCase } from "./PublishEntryUseCase.js";
import { PublishEntryRepository } from "./PublishEntryRepository.js";

export const PublishEntryFeature = createFeature({
    name: "PublishEntry",
    register(container) {
        // Register repository (singleton scope)
        container.register(PublishEntryRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(PublishEntryUseCase);
    }
});
