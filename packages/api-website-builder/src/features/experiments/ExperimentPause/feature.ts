import { createFeature } from "@webiny/feature/api";
import { PauseExperimentUseCase } from "./PauseExperimentUseCase.js";
import { ResumeExperimentUseCase } from "./ResumeExperimentUseCase.js";
import { IsExperimentPausedUseCase } from "./IsExperimentPausedUseCase.js";

export const ExperimentPauseFeature = createFeature({
    name: "WebsiteBuilder/ExperimentPause",
    register(container) {
        container.register(PauseExperimentUseCase);
        container.register(ResumeExperimentUseCase);
        container.register(IsExperimentPausedUseCase);
    }
});
