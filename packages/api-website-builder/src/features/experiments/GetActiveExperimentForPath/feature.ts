import { createFeature } from "@webiny/feature/api";
import { GetActiveExperimentForPathUseCase } from "./GetActiveExperimentForPathUseCase.js";

export const GetActiveExperimentForPathFeature = createFeature({
    name: "WebsiteBuilder/GetActiveExperimentForPath",
    register(container) {
        container.register(GetActiveExperimentForPathUseCase);
    }
});
