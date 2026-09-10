import { createFeature } from "@webiny/feature/api";
import { DeleteExperimentRepository } from "./DeleteExperimentRepository.js";
import { DeleteExperimentUseCase } from "./DeleteExperimentUseCase.js";

export const DeleteExperimentFeature = createFeature({
    name: "WebsiteBuilder/DeleteExperiment",
    register(container) {
        container.register(DeleteExperimentRepository).inSingletonScope();
        container.register(DeleteExperimentUseCase);
    }
});
