import { createFeature } from "@webiny/feature/api";
import { EndExperimentOnPublishHandler } from "./EndExperimentOnPublishHandler.js";

export const EndExperimentOnPublishFeature = createFeature({
    name: "WebsiteBuilder/EndExperimentOnPublish",
    register(container) {
        container.register(EndExperimentOnPublishHandler);
    }
});
