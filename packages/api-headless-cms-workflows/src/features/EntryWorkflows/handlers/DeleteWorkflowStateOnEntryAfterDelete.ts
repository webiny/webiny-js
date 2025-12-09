import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteTargetState } from "../abstractions.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";

class DeleteWorkflowStateOnEntryAfterDeleteImpl implements EntryAfterDeleteHandler.Interface {
    constructor(private deleteTargetState: DeleteTargetState.Interface) {}

    async handle(event: EntryAfterDeleteHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        if (!isModelAllowed(model) || !permanent) {
            return;
        }

        const app = createWorkflowAppName({ model });
        try {
            await this.deleteTargetState.execute(app, entry.id);
        } catch {
            // does not matter
        }
    }
}

export const DeleteWorkflowStateOnEntryAfterDelete = EntryAfterDeleteHandler.createImplementation({
    implementation: DeleteWorkflowStateOnEntryAfterDeleteImpl,
    dependencies: [DeleteTargetState]
});
