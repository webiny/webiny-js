import type { Context } from "~/types.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getState } from "~/utils/state.js";
import type { IWorkflowState } from "@webiny/api-workflows";

interface IParams {
    context: Context;
}

export const attachStateLifecycleEvents = ({ context }: IParams) => {
    const updateEntry = async (state: IWorkflowState): Promise<void> => {
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
                state: getState(state)
            });
        } catch {
            return;
        }
    };

    context.workflowState.onStateAfterCreate.subscribe(async ({ state }) => {
        return updateEntry(state);
    });

    context.workflowState.onStateAfterUpdate.subscribe(async ({ state }) => {
        return updateEntry(state);
    });

    // TODO do we need to clear the state in the entry on workflow state deletion?
    // it might produce a circular call because delete of the state would trigger update of the entry
    // which would again try to delete the state
    context.workflowState.onStateAfterDelete.subscribe(async ({ state }) => {
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
                state: undefined
            });
        } catch {
            // no need to do anything
        }
    });
};
