import { createFeature } from "@webiny/feature/api";
import { UpdateExperimentRepository } from "./UpdateExperimentRepository.js";
import { UpdateExperimentUseCase } from "./UpdateExperimentUseCase.js";

export const UpdateExperimentFeature = createFeature({
    name: "WebsiteBuilder/UpdateExperiment",
    register(container) {
        container.register(UpdateExperimentRepository).inSingletonScope();
        container.register(UpdateExperimentUseCase);
    }
});
