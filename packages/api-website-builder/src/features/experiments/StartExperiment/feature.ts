import { createFeature } from "@webiny/feature/api";
import { StartExperimentRepository } from "./StartExperimentRepository.js";
import { StartExperimentUseCase } from "./StartExperimentUseCase.js";

export const StartExperimentFeature = createFeature({
    name: "WebsiteBuilder/StartExperiment",
    register(container) {
        container.register(StartExperimentRepository).inSingletonScope();
        container.register(StartExperimentUseCase);
    }
});
