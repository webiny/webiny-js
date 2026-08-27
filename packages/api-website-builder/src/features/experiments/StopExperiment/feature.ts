import { createFeature } from "@webiny/feature/api";
import { StopExperimentRepository } from "./StopExperimentRepository.js";
import { StopExperimentUseCase } from "./StopExperimentUseCase.js";

export const StopExperimentFeature = createFeature({
    name: "WebsiteBuilder/StopExperiment",
    register(container) {
        container.register(StopExperimentRepository).inSingletonScope();
        container.register(StopExperimentUseCase);
    }
});
