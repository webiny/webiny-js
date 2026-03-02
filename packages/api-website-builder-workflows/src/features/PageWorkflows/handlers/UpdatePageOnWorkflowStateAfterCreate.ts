import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { WorkflowStateAfterCreateHandler } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/events.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";

class UpdatePageOnWorkflowStateAfterCreateImpl
    implements WorkflowStateAfterCreateHandler.Interface
{
    constructor(private updatePage: UpdatePageUseCase.Interface) {}

    async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
        const { state } = event.payload;

        if (state.app !== WB_PAGE_APP) {
            return;
        }

        const values = getStateValues(state);

        await this.updatePage.execute(state.targetRevisionId, {
            system: {
                workflow: values
            }
        });
    }
}

export const UpdatePageOnWorkflowStateAfterCreate =
    WorkflowStateAfterCreateHandler.createImplementation({
        implementation: UpdatePageOnWorkflowStateAfterCreateImpl,
        dependencies: [UpdatePageUseCase]
    });
