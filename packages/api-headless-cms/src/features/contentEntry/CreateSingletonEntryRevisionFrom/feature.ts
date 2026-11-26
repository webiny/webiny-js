import { createFeature } from "@webiny/feature/api";
import { CreateSingletonEntryRevisionFromUseCase } from "./CreateSingletonEntryRevisionFromUseCase.js";

/**
 * CreateSingletonEntryRevisionFrom Feature
 *
 * Creates a new singleton entry revision from an existing one.
 */
export const CreateSingletonEntryRevisionFromFeature = createFeature({
    name: "CreateSingletonEntryRevisionFrom",
    register(container) {
        container.register(CreateSingletonEntryRevisionFromUseCase);
    }
});
