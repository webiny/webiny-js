import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { WorkflowStateAfterUpdateHandler } from "@webiny/api-workflows/features/workflowState/UpdateWorkflowState/events.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";

class UpdatePageOnWorkflowStateAfterUpdateImpl
    implements WorkflowStateAfterUpdateHandler.Interface
{
    constructor(private updatePage: UpdatePageUseCase.Interface) {}

    async handle(event: WorkflowStateAfterUpdateHandler.Event): Promise<void> {
        const { state } = event.payload;

        if (state.app !== WB_PAGE_APP) {
            return;
        }

        const values = getStateValues(state);

        await this.updatePage.execute(state.targetRevisionId, {
            state: values
        });
    }
}

export const UpdatePageOnWorkflowStateAfterUpdate =
    WorkflowStateAfterUpdateHandler.createImplementation({
        implementation: UpdatePageOnWorkflowStateAfterUpdateImpl,
        dependencies: [UpdatePageUseCase]
    });
