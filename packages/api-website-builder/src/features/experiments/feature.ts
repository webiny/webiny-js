import { createFeature } from "@webiny/feature/api";
import { CreateExperimentFeature } from "./CreateExperiment/feature.js";
import { UpdateExperimentFeature } from "./UpdateExperiment/feature.js";
import { GetExperimentByIdFeature } from "./GetExperimentById/feature.js";
import { ListExperimentsFeature } from "./ListExperiments/feature.js";
import { GetActiveExperimentForRevisionFeature } from "./GetActiveExperimentForRevision/feature.js";
import { GetActiveExperimentForPathFeature } from "./GetActiveExperimentForPath/feature.js";
import { StartExperimentFeature } from "./StartExperiment/feature.js";
import { StopExperimentFeature } from "./StopExperiment/feature.js";
import { DeleteExperimentFeature } from "./DeleteExperiment/feature.js";
import { GraduateVariantFeature } from "./GraduateVariant/feature.js";
import { EndExperimentOnPublishFeature } from "./EndExperimentOnPublish/feature.js";
import { ExperimentPauseFeature } from "./ExperimentPause/feature.js";

/** Registers every experiment use case (CRUD, lifecycle, kill-switch, publish handler). */
export const ExperimentFeature = createFeature({
    name: "WebsiteBuilder/Experiment",
    register(container) {
        CreateExperimentFeature.register(container);
        UpdateExperimentFeature.register(container);
        GetExperimentByIdFeature.register(container);
        ListExperimentsFeature.register(container);
        GetActiveExperimentForRevisionFeature.register(container);
        GetActiveExperimentForPathFeature.register(container);
        StartExperimentFeature.register(container);
        StopExperimentFeature.register(container);
        DeleteExperimentFeature.register(container);
        GraduateVariantFeature.register(container);
        EndExperimentOnPublishFeature.register(container);
        ExperimentPauseFeature.register(container);
    }
});
