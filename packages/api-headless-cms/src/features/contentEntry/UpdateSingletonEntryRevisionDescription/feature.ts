import { createFeature } from "@webiny/feature/api";
import { UpdateSingletonEntryRevisionDescriptionUseCase } from "./UpdateSingletonEntryRevisionDescriptionUseCase.js";

/**
 * UpdateSingletonEntryRevisionDescription Feature
 *
 * Updates the description of a singleton entry revision.
 */
export const UpdateSingletonEntryRevisionDescriptionFeature = createFeature({
    name: "UpdateSingletonEntryRevisionDescription",
    register(container) {
        container.register(UpdateSingletonEntryRevisionDescriptionUseCase);
    }
});
