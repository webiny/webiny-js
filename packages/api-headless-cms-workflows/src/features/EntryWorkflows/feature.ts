import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowsOnModelAfterDelete } from "./handlers/DeleteWorkflowsOnModelAfterDelete.js";
import { DeleteWorkflowStateOnEntryAfterDelete } from "./handlers/DeleteWorkflowStateOnEntryAfterDelete.js";
import { ValidateWorkflowStateOnEntryBeforePublish } from "./handlers/ValidateWorkflowStateOnEntryBeforePublish.js";
import { UpdateEntryOnWorkflowStateAfterCreate } from "./handlers/UpdateEntryOnWorkflowStateAfterCreate.js";
import { UpdateEntryOnWorkflowStateAfterUpdate } from "./handlers/UpdateEntryOnWorkflowStateAfterUpdate.js";
import { ClearEntryStateOnWorkflowStateAfterDelete } from "./handlers/ClearEntryStateOnWorkflowStateAfterDelete.js";
import { ClearEntryStateOnWorkflowStateCancel } from "./handlers/ClearEntryStateOnWorkflowStateCancel.js";
import { BlockMoveOnActiveWorkflowState } from "./handlers/BlockMoveOnActiveWorkflowState.js";
import { CmsWorkflowStateContextProvider } from "./decorators/CmsWorkflowStateContextProvider.js";
import { CmsWorkflowStateFilter } from "./decorators/CmsWorkflowStateFilter.js";

export const EntryWorkflowsFeature = createFeature({
    name: "EntryWorkflows",
    register(container) {
        container.register(DeleteWorkflowsOnModelAfterDelete);
        container.register(DeleteWorkflowStateOnEntryAfterDelete);
        container.register(ValidateWorkflowStateOnEntryBeforePublish);
        container.register(UpdateEntryOnWorkflowStateAfterCreate);
        container.register(UpdateEntryOnWorkflowStateAfterUpdate);
        container.register(ClearEntryStateOnWorkflowStateAfterDelete);
        container.register(ClearEntryStateOnWorkflowStateCancel);
        container.register(BlockMoveOnActiveWorkflowState);
        container.registerDecorator(CmsWorkflowStateContextProvider);
        container.registerDecorator(CmsWorkflowStateFilter);
    }
});
