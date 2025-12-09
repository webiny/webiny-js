import type { Context } from "~/types.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";
import type { IWorkflowState } from "@webiny/api-workflows";
import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";

interface IParams {
    context: Context;
}

export const attachStateLifecycleEvents = ({ context }: IParams) => {
    const updateEntry = async (
        state: IWorkflowState,
        values: ICmsEntryState | undefined
    ): Promise<void> => {
        const modelId = getModelIdFromAppName(state.app);
        if (!modelId) {
            return;
        }

        const getModel = context.container.resolve(GetModelUseCase);
        const updateEntry = context.container.resolve(UpdateEntryUseCase);

        const modelResult = await getModel.execute(modelId);

        if (modelResult.isFail()) {
            console.log(modelResult.error);
            return;
        }

        const updateResult = await updateEntry.execute(modelResult.value, state.targetRevisionId, {
            state: values
        });

        if (updateResult.isFail()) {
            console.log(updateResult.error);
        }
    };

    context.workflowState.onStateAfterCreate.subscribe(async ({ state }) => {
        return updateEntry(state, getStateValues(state));
    });

    context.workflowState.onStateAfterUpdate.subscribe(async ({ state }) => {
        return updateEntry(state, getStateValues(state));
    });

    // TODO do we need to clear the state in the entry on workflow state deletion?
    // it might produce a circular call because delete of the state would trigger update of the entry
    // which would again try to delete the state
    context.workflowState.onStateAfterDelete.subscribe(async ({ state }) => {
        return updateEntry(state, undefined);
    });
};
