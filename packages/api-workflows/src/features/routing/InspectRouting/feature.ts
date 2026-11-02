import { createFeature } from "@webiny/feature/api";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

export const InspectRoutingFeature = createFeature({
    name: "Workflows/InspectRouting",
    register(container) {
        container.register(InspectRoutingUseCase);
    }
});
