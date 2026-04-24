import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { WorkflowStateAfterDeleteHandler } from "@webiny/api-workflows/features/workflowState/DeleteTargetWorkflowState/events.js";
import { WB_PAGE_APP } from "~/utils/appName.js";

class ClearPageStateOnWorkflowStateAfterDeleteImpl
    implements WorkflowStateAfterDeleteHandler.Interface
{
    constructor(private updatePage: UpdatePageUseCase.Interface) {}

    async handle(event: WorkflowStateAfterDeleteHandler.Event): Promise<void> {
        const { state } = event.payload;

        if (state.app !== WB_PAGE_APP) {
            return;
        }

        await this.updatePage.execute(state.targetRevisionId, {
            system: {
                workflow: undefined
            }
        });
    }
}

export const ClearPageStateOnWorkflowStateAfterDelete =
    WorkflowStateAfterDeleteHandler.createImplementation({
        implementation: ClearPageStateOnWorkflowStateAfterDeleteImpl,
        dependencies: [UpdatePageUseCase]
    });
