import { createFeature } from "@webiny/feature/api";
import { UpdateRevisionDescriptionUseCase } from "./UpdateRevisionDescriptionUseCase.js";

/**
 * UpdateRevisionDescription Feature
 *
 * Provides complete functionality for updating content entries:
 * - Use case for orchestration
 * - Repository for persistence
 * - Events for extensibility
 */
export const UpdateRevisionDescriptionFeature = createFeature({
    name: "UpdateRevisionDescription",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(UpdateRevisionDescriptionUseCase);
    }
});
