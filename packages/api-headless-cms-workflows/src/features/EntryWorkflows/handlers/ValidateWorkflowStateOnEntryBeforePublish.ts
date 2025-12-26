import { WebinyError } from "@webiny/error";
import { EntryBeforePublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";

class ValidateWorkflowStateOnEntryBeforePublishImpl implements EntryBeforePublishHandler.Interface {
    constructor(private getTargetState: GetTargetWorkflowStateUseCase.Interface) {}

    async handle(event: EntryBeforePublishHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });

        const stateResult = await this.getTargetState.execute({ app, targetRevisionId: entry.id });

        if (stateResult.isFail()) {
            // If there's no state to deal with, exit early.
            return;
        }

        const state = stateResult.value;

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
