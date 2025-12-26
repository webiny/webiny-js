import { createFeature } from "@webiny/feature/api";
import { ValidateWorkflowStateOnPageBeforePublish } from "./handlers/ValidateWorkflowStateOnPageBeforePublish.js";
import { DeleteWorkflowStateOnPageAfterDelete } from "./handlers/DeleteWorkflowStateOnPageAfterDelete.js";
import { UpdatePageOnWorkflowStateAfterCreate } from "./handlers/UpdatePageOnWorkflowStateAfterCreate.js";
import { UpdatePageOnWorkflowStateAfterUpdate } from "./handlers/UpdatePageOnWorkflowStateAfterUpdate.js";
import { ClearPageStateOnWorkflowStateAfterDelete } from "./handlers/ClearPageStateOnWorkflowStateAfterDelete.js";

export const PageWorkflowsFeature = createFeature({
    name: "PageWorkflows",
    register(container) {
        container.register(ValidateWorkflowStateOnPageBeforePublish);
        container.register(DeleteWorkflowStateOnPageAfterDelete);
        container.register(UpdatePageOnWorkflowStateAfterCreate);
        container.register(UpdatePageOnWorkflowStateAfterUpdate);
        container.register(ClearPageStateOnWorkflowStateAfterDelete);
    }
});
