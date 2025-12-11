import type { Context, IWbPageState } from "~/types.js";
import type { IWorkflowState } from "@webiny/api-workflows";
import { getStateValues } from "~/utils/state.js";
import { WB_PAGE_APP } from "~/constants.js";

interface IParams {
    context: Context;
}

export const attachStateLifecycleEvents = ({ context }: IParams) => {
    const updatePage = async (
        state: IWorkflowState,
        values: IWbPageState | undefined
    ): Promise<void> => {
        if (state.app !== WB_PAGE_APP) {
            return;
        }
        try {
            await context.websiteBuilder.pages.update(state.targetRevisionId, {
                state: values
            });
        } catch (ex) {
            // no need to do anything, just log the error
            console.log(ex);
        }
    };

    context.workflowState.onStateAfterCreate.subscribe(async ({ state }) => {
        return updatePage(state, getStateValues(state));
    });

    context.workflowState.onStateAfterUpdate.subscribe(async ({ state }) => {
        return updatePage(state, getStateValues(state));
    });

    context.workflowState.onStateAfterDelete.subscribe(async ({ state }) => {
        return updatePage(state, undefined);
    });
};
