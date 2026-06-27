import { EntryBeforeMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";
import { EntryMoveBlockedByWorkflowStateError } from "../errors.js";

class BlockMoveOnActiveWorkflowStateImpl implements EntryBeforeMoveEventHandler.Interface {
    constructor(private getTargetState: GetTargetWorkflowStateUseCase.Interface) {}

    async handle(event: EntryBeforeMoveEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (!isModelAllowed(model)) {
            return;
        }

        const app = createWorkflowAppName({ model });

        const stateResult = await this.getTargetState.execute({
            app,
            targetRevisionId: entry.id
        });

        if (stateResult.isFail()) {
            return;
        }

        const state = stateResult.value;

        if (state.done) {
            return;
        }

        throw new EntryMoveBlockedByWorkflowStateError({
            app,
            entryId: entry.id
        });
    }
}

export const BlockMoveOnActiveWorkflowState = EntryBeforeMoveEventHandler.createImplementation({
    implementation: BlockMoveOnActiveWorkflowStateImpl,
    dependencies: [GetTargetWorkflowStateUseCase]
});
