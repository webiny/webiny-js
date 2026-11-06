import { createFeature } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "./GetRevisionsByEntryIdUseCase.js";
import { GetRevisionsByEntryIdRepository } from "./GetRevisionsByEntryIdRepository.js";
import { GetRevisionsByEntryIdOwnEntriesDecorator } from "./decorators/GetRevisionsByEntryIdOwnEntriesDecorator.js";

export const GetRevisionsByEntryIdFeature = createFeature({
    name: "GetRevisionsByEntryId",
    register(container) {
        container.register(GetRevisionsByEntryIdUseCase);
        container.register(GetRevisionsByEntryIdRepository).inSingletonScope();
        container.registerDecorator(GetRevisionsByEntryIdOwnEntriesDecorator);
    }
});
