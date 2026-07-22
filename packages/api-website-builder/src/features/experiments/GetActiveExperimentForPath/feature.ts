import { createFeature } from "@webiny/feature/api";
import { GetActiveExperimentForPathRepository } from "./GetActiveExperimentForPathRepository.js";
import { GetActiveExperimentForPathUseCase } from "./GetActiveExperimentForPathUseCase.js";

export const GetActiveExperimentForPathFeature = createFeature({
    name: "WebsiteBuilder/GetActiveExperimentForPath",
    register(container) {
        container.register(GetActiveExperimentForPathRepository).inSingletonScope();
        container.register(GetActiveExperimentForPathUseCase);
    }
});
