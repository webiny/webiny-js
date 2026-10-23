import { createFeature } from "@webiny/feature/api";
import { WorkflowBypassService } from "./WorkflowBypassService.js";

export const WorkflowBypassServiceFeature = createFeature({
    name: "Workflows/WorkflowBypassService",
    register(container) {
        // One instance per request container, so every consumer in the request shares one flag.
        container.register(WorkflowBypassService).inSingletonScope();
    }
});
