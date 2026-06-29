import { PageBeforeMoveEventHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";
import { PageMoveBlockedByWorkflowStateError } from "../errors.js";

class BlockMoveOnActiveWorkflowStateImpl implements PageBeforeMoveEventHandler.Interface {
    constructor(private getTargetState: GetTargetWorkflowStateUseCase.Interface) {}

    async handle(event: PageBeforeMoveEventHandler.Event): Promise<void> {
        const { original } = event.payload;

        const stateResult = await this.getTargetState.execute({
            app: WB_PAGE_APP,
            targetRevisionId: original.id
        });

        if (stateResult.isFail()) {
            return;
        }

        const state = stateResult.value;

        if (state.done) {
            return;
        }

        throw new PageMoveBlockedByWorkflowStateError({
            pageId: original.id
        });
    }
}

export const BlockMoveOnActiveWorkflowState = PageBeforeMoveEventHandler.createImplementation({
    implementation: BlockMoveOnActiveWorkflowStateImpl,
    dependencies: [GetTargetWorkflowStateUseCase]
});
