import { createFeature } from "@webiny/feature/api";
import { CreateEntryRevisionFromUseCase } from "./CreateEntryRevisionFromUseCase.js";
import { CreateEntryRevisionFromRepository } from "./CreateEntryRevisionFromRepository.js";

export const CreateEntryRevisionFromFeature = createFeature({
    name: "CreateEntryRevisionFrom",
    register(container) {
        // Register repository (singleton scope)
        container.register(CreateEntryRevisionFromRepository).inSingletonScope();

        // Register use case (transient scope)
        container.register(CreateEntryRevisionFromUseCase);
    }
});
