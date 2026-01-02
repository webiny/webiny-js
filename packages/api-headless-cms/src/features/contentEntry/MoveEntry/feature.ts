import { createFeature } from "@webiny/feature/api";
import { MoveEntryUseCase } from "./MoveEntryUseCase.js";
import { MoveEntryRepository } from "./MoveEntryRepository.js";

export const MoveEntryFeature = createFeature({
    name: "MoveEntry",
    register(container) {
        // Register repository (singleton scope)
        container.register(MoveEntryRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(MoveEntryUseCase);
    }
});
