import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowsOnModelAfterDelete } from "./handlers/DeleteWorkflowsOnModelAfterDelete.js";
import { DeleteWorkflowStateOnEntryAfterDelete } from "./handlers/DeleteWorkflowStateOnEntryAfterDelete.js";
import { ValidateWorkflowStateOnEntryBeforePublish } from "./handlers/ValidateWorkflowStateOnEntryBeforePublish.js";

export const EntryWorkflowsFeature = createFeature({
    name: "EntryWorkflows",
    register(container) {
        container.register(DeleteWorkflowsOnModelAfterDelete);
        container.register(DeleteWorkflowStateOnEntryAfterDelete);
        container.register(ValidateWorkflowStateOnEntryBeforePublish);
    }
});
