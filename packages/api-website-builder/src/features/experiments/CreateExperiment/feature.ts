import { createFeature } from "@webiny/feature/api";
import { CreateExperimentRepository } from "./CreateExperimentRepository.js";
import { CreateExperimentUseCase } from "./CreateExperimentUseCase.js";

export const CreateExperimentFeature = createFeature({
    name: "WebsiteBuilder/CreateExperiment",
    register(container) {
        container.register(CreateExperimentRepository).inSingletonScope();
        container.register(CreateExperimentUseCase);
    }
});
