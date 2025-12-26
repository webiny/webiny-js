import { createFeature } from "@webiny/feature/api";
import { CreateModelFromUseCase } from "./CreateModelFromUseCase.js";
import { CreateModelFromRepository } from "./CreateModelFromRepository.js";

/**
 * CreateModelFrom Feature
 *
 * Provides functionality for cloning/copying existing content models.
 * All validation (modelId generation, domain rules, uniqueness) is handled by the repository.
 */
export const CreateModelFromFeature = createFeature({
    name: "CreateModelFrom",
    register(container) {
        // Register core use case
        container.register(CreateModelFromUseCase);

        // Register repository in singleton scope (shared instance)
        container.register(CreateModelFromRepository).inSingletonScope();
    }
});
