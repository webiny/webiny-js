import { createFeature } from "@webiny/feature/api";
import { CreateSimpleEntryRepository } from "./CreateSimpleEntryRepository.js";
import { CreateSimpleEntryUseCase } from "./CreateSimpleEntryUseCase.js";

export const CreateSimpleEntryFeature = createFeature({
    name: "CreateSimpleEntry",
    register(container) {
        container.register(CreateSimpleEntryUseCase);
        container.register(CreateSimpleEntryRepository).inSingletonScope();
    }
});
