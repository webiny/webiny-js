import { createFeature } from "@webiny/feature/api";
import { BaseUseCase } from "./BaseUseCase.js";
import { GetPreviousRevisionByEntryIdOwnEntriesDecorator } from "./decorators/GetPreviousRevisionByEntryIdOwnEntriesDecorator.js";
import { GetPreviousRevisionByEntryIdRepository } from "./GetPreviousRevisionByEntryIdRepository.js";
import { GetPreviousRevisionByEntryIdUseCase } from "./GetPreviousRevisionByEntryIdUseCase.js";

export const GetPreviousRevisionByEntryIdFeature = createFeature({
    name: "GetPreviousRevisionByEntryId",
    register(container) {
        // Register repository (singleton scope)
        container.register(GetPreviousRevisionByEntryIdRepository).inSingletonScope();

        // Register base use case (internal, returns any entry regardless of deleted state)
        container.register(BaseUseCase);

        // Entry-level (owner) access check, applies to all variations
        container.registerDecorator(GetPreviousRevisionByEntryIdOwnEntriesDecorator);

        // Register public use case (non-deleted entries only)
        container.register(GetPreviousRevisionByEntryIdUseCase);
    }
});
