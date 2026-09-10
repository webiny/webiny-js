import { createFeature } from "@webiny/feature/api";
import { GetExperimentByIdRepository } from "./GetExperimentByIdRepository.js";
import { GetExperimentByIdUseCase } from "./GetExperimentByIdUseCase.js";

export const GetExperimentByIdFeature = createFeature({
    name: "WebsiteBuilder/GetExperimentById",
    register(container) {
        container.register(GetExperimentByIdRepository).inSingletonScope();
        container.register(GetExperimentByIdUseCase);
    }
});
