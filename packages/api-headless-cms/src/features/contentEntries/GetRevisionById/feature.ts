import { createFeature } from "@webiny/feature/api";
import { GetRevisionByIdUseCase } from "./GetRevisionByIdUseCase.js";
import { GetRevisionByIdRepository } from "./GetRevisionByIdRepository.js";
import { GetRevisionByIdNotDeleted } from "./decorators/GetRevisionByIdNotDeletedDecorator.js";

/**
 * GetRevisionById Feature
 *
 * Provides functionality for fetching entry revisions by ID:
 * - Use case for orchestration
 * - Repository for data fetching
 * - NotDeleted decorator to filter deleted entries
 */
export const GetRevisionByIdFeature = createFeature({
    name: "GetRevisionById",
    register(container) {
        // Register repository in singleton scope
        container.register(GetRevisionByIdRepository).inSingletonScope();

        // Register use case in transient scope
        container.register(GetRevisionByIdUseCase);

        // Register decorator (filters deleted entries)
        container.register(GetRevisionByIdNotDeleted);
    }
});
