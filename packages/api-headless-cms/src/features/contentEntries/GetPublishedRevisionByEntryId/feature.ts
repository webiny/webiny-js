import { createFeature } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdUseCase } from "./GetPublishedRevisionByEntryIdUseCase.js";
import { GetPublishedRevisionByEntryIdRepository } from "./GetPublishedRevisionByEntryIdRepository.js";

/**
 * GetPublishedRevisionByEntryId Feature
 *
 * Provides complete functionality for fetching published revision by entry ID:
 * - Use case for orchestration
 * - Repository for data fetching
 */
export const GetPublishedRevisionByEntryIdFeature = createFeature({
    name: "GetPublishedRevisionByEntryId",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(GetPublishedRevisionByEntryIdUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(GetPublishedRevisionByEntryIdRepository).inSingletonScope();
    }
});
