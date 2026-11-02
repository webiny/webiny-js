import { createFeature } from "@webiny/feature/api";
import { InspectCmsEntryRoutingUseCase } from "./InspectCmsEntryRoutingUseCase.js";

export const InspectCmsEntryRoutingFeature = createFeature({
    name: "CmsWorkflows/InspectCmsEntryRouting",
    register(container) {
        container.register(InspectCmsEntryRoutingUseCase);
    }
});
