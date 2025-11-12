import { createFeature } from "@webiny/feature/api";
import { RestoreEntryFromBinUseCase } from "./RestoreEntryFromBinUseCase.js";
import { RestoreEntryFromBinRepository } from "./RestoreEntryFromBinRepository.js";

export const RestoreEntryFromBinFeature = createFeature({
    name: "RestoreEntryFromBin",
    register(container) {
        // Register repository (singleton scope)
        container.register(RestoreEntryFromBinRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(RestoreEntryFromBinUseCase);
    }
});
