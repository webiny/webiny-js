import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteWorkflowsOnModelAfterDelete } from "./handlers/DeleteWorkflowsOnModelAfterDelete.js";
import { DeleteWorkflowStateOnEntryAfterDelete } from "./handlers/DeleteWorkflowStateOnEntryAfterDelete.js";
import { ValidateWorkflowStateOnEntryBeforePublish } from "./handlers/ValidateWorkflowStateOnEntryBeforePublish.js";

export const EntryWorkflowsFeature = createFeature({
    name: "EntryWorkflows",
    register(container: Container) {
        container.register(DeleteWorkflowsOnModelAfterDelete);
        container.register(DeleteWorkflowStateOnEntryAfterDelete);
        container.register(ValidateWorkflowStateOnEntryBeforePublish);
    }
});
