import { createFeature } from "@webiny/feature/api";
import { WorkflowsAdminUrlService } from "./WorkflowsAdminUrlService.js";

export const WorkflowsAdminUrlServiceFeature = createFeature({
    name: "WorkflowNotifications/WorkflowsAdminUrlService",
    register(container) {
        container.register(WorkflowsAdminUrlService);
    }
});
