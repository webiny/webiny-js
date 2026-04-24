import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import { DeleteTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/DeleteTargetWorkflowState/index.js";

class DeleteWorkflowStateOnEntryAfterDeleteImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private deleteTargetState: DeleteTargetWorkflowStateUseCase.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        if (!isModelAllowed(model) || !permanent) {
            return;
        }

        const app = createWorkflowAppName({ model });
        await this.deleteTargetState.execute(app, entry.id);
    }
}

export const DeleteWorkflowStateOnEntryAfterDelete =
    EntryAfterDeleteEventHandler.createImplementation({
        implementation: DeleteWorkflowStateOnEntryAfterDeleteImpl,
        dependencies: [DeleteTargetWorkflowStateUseCase]
    });
