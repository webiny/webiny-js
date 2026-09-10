import { createFeature } from "@webiny/feature/api";
import { DeleteSimpleEntryRepository } from "./DeleteSimpleEntryRepository.js";
import { DeleteSimpleEntryUseCase } from "./DeleteSimpleEntryUseCase.js";

export const DeleteSimpleEntryFeature = createFeature({
    name: "DeleteSimpleEntry",
    register(container) {
        container.register(DeleteSimpleEntryUseCase);
        container.register(DeleteSimpleEntryRepository).inSingletonScope();
    }
});
