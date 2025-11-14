import { IWorkflowState } from "@webiny/api-workflows";
import { WebinyError } from "@webiny/error";
import type { Context } from "~/types.js";
import { WB_PAGE_APP } from "~/constants.js";

interface IParams {
    context: Pick<Context, "workflowState" | "websiteBuilder">;
}

export const attachUpdatePageLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.websiteBuilder.pages.onPageBeforeUpdate.subscribe(async ({ original }) => {
        let state: IWorkflowState;
        try {
            state = await context.workflowState.getTargetState(WB_PAGE_APP, original.id);
        } catch {
            // does not matter
            return;
        }
        throw new WebinyError({
            message: "Cannot update page because it is currently in a workflow.",
            code: "ENTRY_IN_WORKFLOW",
            data: {
                state: {
                    ...state
                }
            }
        });
    });
};
