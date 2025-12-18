import { WebinyError } from "@webiny/error";
import { EntryBeforePublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

class ValidateWorkflowStateOnEntryBeforePublishImpl implements EntryBeforePublishHandler.Interface {
    constructor(private getTargetState: GetTargetWorkflowStateUseCase.Interface) {}

    async handle(event: EntryBeforePublishHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });

        let state: WorkflowState | undefined;
        const stateResult = await this.getTargetState.execute({ app, targetRevisionId: entry.id });
        state = stateResult.value;

        if (state?.done) {
            entry.state = undefined;
            return;
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
        dependencies: [GetTargetWorkflowStateUseCase]
    });
