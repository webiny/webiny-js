import { createFeature } from "@webiny/feature/api";
import { WorkflowModelParserService } from "./WorkflowModelParserService/WorkflowModelParserService.js";

/** Reads workflow models through the parsers the app adapters register. */
export const WorkflowModelFeature = createFeature({
    name: "Workflows/WorkflowModel",
    register(container) {
        container.register(WorkflowModelParserService);
    }
});
