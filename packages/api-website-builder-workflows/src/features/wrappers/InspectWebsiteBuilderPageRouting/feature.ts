import { createFeature } from "@webiny/feature/api";
import { InspectWebsiteBuilderPageRoutingUseCase } from "./InspectWebsiteBuilderPageRoutingUseCase.js";

export const InspectWebsiteBuilderPageRoutingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/InspectWebsiteBuilderPageRouting",
    register(container) {
        container.register(InspectWebsiteBuilderPageRoutingUseCase);
    }
});
