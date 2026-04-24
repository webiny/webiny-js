import { createFeature } from "@webiny/feature/api";
import { GetModelUseCase } from "./GetModelUseCase.js";
import { GetModelRepository } from "./GetModelRepository.js";

/**
 * GetModel Feature
 *
 * Provides functionality for retrieving a single content model by ID.
 * Includes caching, plugin model support, and access control filtering.
 */
export const GetModelFeature = createFeature({
    name: "GetModel",
    register(container) {
        // Register use case in transient scope (new instance per request)
        container.register(GetModelUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(GetModelRepository).inSingletonScope();
    }
});
