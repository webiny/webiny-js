import { createFeature } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "./GetRevisionsByEntryIdUseCase.js";
import { GetRevisionsByEntryIdRepository } from "./GetRevisionsByEntryIdRepository.js";

export const GetRevisionsByEntryIdFeature = createFeature({
    name: "GetRevisionsByEntryId",
    register(container) {
        container.register(GetRevisionsByEntryIdUseCase);
        container.register(GetRevisionsByEntryIdRepository).inSingletonScope();
    }
});
