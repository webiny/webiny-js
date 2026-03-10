import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { DeleteTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/DeleteTargetWorkflowState/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";

class DeleteWorkflowStateOnPageAfterDeleteImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private deleteTargetState: DeleteTargetWorkflowStateUseCase.Interface) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        await this.deleteTargetState.execute(WB_PAGE_APP, page.id);
    }
}

export const DeleteWorkflowStateOnPageAfterDelete = PageAfterDeleteEventHandler.createImplementation({
    implementation: DeleteWorkflowStateOnPageAfterDeleteImpl,
    dependencies: [DeleteTargetWorkflowStateUseCase]
});
