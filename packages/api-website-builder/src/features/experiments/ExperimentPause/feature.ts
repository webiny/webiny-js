import { createFeature } from "@webiny/feature/api";
import {
    PauseExperimentUseCase,
    ResumeExperimentUseCase,
    IsExperimentPausedUseCase
} from "./ExperimentPauseUseCases.js";

export const ExperimentPauseFeature = createFeature({
    name: "WebsiteBuilder/ExperimentPause",
    register(container) {
        container.register(PauseExperimentUseCase);
        container.register(ResumeExperimentUseCase);
        container.register(IsExperimentPausedUseCase);
    }
});
