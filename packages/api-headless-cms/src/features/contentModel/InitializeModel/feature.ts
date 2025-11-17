import { createFeature } from "@webiny/feature/api";
import { InitializeModelUseCase } from "./InitializeModelUseCase.js";

/**
 * InitializeModel Feature
 *
 * Provides functionality for initializing models with data.
 * This is primarily an event dispatch mechanism that allows plugins to
 * perform initialization tasks (e.g., creating default entries).
 */
export const InitializeModelFeature = createFeature({
    name: "InitializeModel",
    register(container) {
        // Register core use case
        container.register(InitializeModelUseCase);
    }
});
