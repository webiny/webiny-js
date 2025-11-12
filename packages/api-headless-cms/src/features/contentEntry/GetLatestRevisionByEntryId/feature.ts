import { createFeature } from "@webiny/feature/api";
import { BaseUseCase } from "./BaseUseCase.js";
import { GetLatestRevisionByEntryIdRepository } from "./GetLatestRevisionByEntryIdRepository.js";
import { GetLatestRevisionByEntryIdUseCase } from "./variations/GetLatestRevisionByEntryIdUseCase.js";
import { GetLatestDeletedRevisionByEntryIdUseCase } from "./variations/GetLatestDeletedRevisionByEntryIdUseCase.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "./variations/GetLatestRevisionByEntryIdIncludingDeletedUseCase.js";

export const GetLatestRevisionByEntryIdFeature = createFeature({
    name: "GetLatestRevisionByEntryId",
    register(container) {
        // Register repository (singleton scope)
        container.register(GetLatestRevisionByEntryIdRepository).inSingletonScope();

        // Register base use case (internal, returns any entry regardless of deleted state)
        container.register(BaseUseCase);

        // Register three public use case variations (all use transient scope)
        // 1. Non-deleted entry only (default)
        container.register(GetLatestRevisionByEntryIdUseCase);

        // 2. Deleted entry only
        container.register(GetLatestDeletedRevisionByEntryIdUseCase);

        // 3. Deleted AND non-deleted entry
        container.register(GetLatestRevisionByEntryIdIncludingDeletedUseCase);
    }
});
