import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { WorkflowStateCancelHandler } from "@webiny/api-workflows/features/workflowState/CancelWorkflowState/events.js";
import { WB_PAGE_APP } from "~/utils/appName.js";

class ClearPageStateOnWorkflowStateCancelImpl implements WorkflowStateCancelHandler.Interface {
    constructor(private updatePage: UpdatePageUseCase.Interface) {}

    async handle(event: WorkflowStateCancelHandler.Event): Promise<void> {
        const { state } = event.payload;

        if (state.app !== WB_PAGE_APP) {
            return;
        }

        await this.updatePage.execute(state.targetRevisionId, {
            system: {
                workflow: null
            }
        });
    }
}

export const ClearPageStateOnWorkflowStateCancel = WorkflowStateCancelHandler.createImplementation({
    implementation: ClearPageStateOnWorkflowStateCancelImpl,
    dependencies: [UpdatePageUseCase]
});
