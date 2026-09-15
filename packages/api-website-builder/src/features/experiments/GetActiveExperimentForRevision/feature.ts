import { createFeature } from "@webiny/feature/api";
import { GetActiveExperimentForRevisionRepository } from "./GetActiveExperimentForRevisionRepository.js";
import { GetActiveExperimentForRevisionUseCase } from "./GetActiveExperimentForRevisionUseCase.js";

export const GetActiveExperimentForRevisionFeature = createFeature({
    name: "WebsiteBuilder/GetActiveExperimentForRevision",
    register(container) {
        container.register(GetActiveExperimentForRevisionRepository).inSingletonScope();
        container.register(GetActiveExperimentForRevisionUseCase);
    }
});
