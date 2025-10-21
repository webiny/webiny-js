import type { Context } from "~/types.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";
import type { IWorkflowState } from "@webiny/api-workflows";
import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";

interface IParams {
    context: Context;
}

export const attachStateLifecycleEvents = ({ context }: IParams) => {
    const updateEntry = async (
        state: IWorkflowState,
        values: ICmsEntryState | undefined
    ): Promise<void> => {
        /**
         * Should not happen but let's be safe.
         */
        if (!state.record) {
            return;
        }
        const modelId = getModelIdFromAppName(state.record.app);
        if (!modelId) {
            return;
        }
        try {
            const model = await context.cms.getModel(modelId);
            await context.cms.updateEntry(model, state.record.targetRevisionId, {
                state: values
            });
        } catch (ex) {
            // no need to do anything, just log the error
            console.log(ex);
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
