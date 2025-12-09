import { WebinyError } from "@webiny/error";
import { EntryBeforePublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { GetTargetState } from "../abstractions.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import type { IWorkflowStateModel } from "@webiny/api-workflows/context/abstractions/WorkflowState.js";
import { WorkflowStateNotFoundError } from "@webiny/api-workflows";

class ValidateWorkflowStateOnEntryBeforePublishImpl implements EntryBeforePublishHandler.Interface {
    constructor(private getTargetState: GetTargetState.Interface) {}

    async handle(event: EntryBeforePublishHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });

        let state: IWorkflowStateModel | undefined = undefined;
        try {
            state = await this.getTargetState.execute(app, entry.id);
            if (state?.done) {
                entry.state = undefined;
                return;
            }
        } catch (ex) {
            // Swallow error if workflow state is not found.
            if (ex instanceof WorkflowStateNotFoundError) {
                return;
            }
            throw ex;
        }

        throw new WebinyError(
            "Cannot publish entry because its workflow state is not completed.",
            "WORKFLOW_STATE_NOT_COMPLETED",
            {
                app,
                entryId: entry.id,
                state: {
                    ...state
                }
            }
        );
    }
}

export const ValidateWorkflowStateOnEntryBeforePublish =
    EntryBeforePublishHandler.createImplementation({
        implementation: ValidateWorkflowStateOnEntryBeforePublishImpl,
        dependencies: [GetTargetState]
    });
