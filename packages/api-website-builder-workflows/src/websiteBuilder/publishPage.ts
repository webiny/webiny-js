import { WebinyError } from "@webiny/error";
import type { Context } from "~/types.js";
import type { IWorkflowState } from "@webiny/api-workflows";
import { WorkflowStateNotFoundError } from "@webiny/api-workflows";
import { WB_PAGE_APP } from "~/constants.js";

interface IParams {
    context: Pick<Context, "workflowState" | "websiteBuilder">;
}

export const attachPublishPageLifecycleEvents = (params: IParams) => {
    const { context } = params;

    context.websiteBuilder.pages.onPageBeforePublish.subscribe(async ({ page }) => {
        let state: IWorkflowState | undefined = undefined;
        try {
            state = await context.workflowState.getTargetState(WB_PAGE_APP, page.id);
            if (state?.done) {
                return;
            }
        } catch (ex) {
            // Swallow error if workflow state is not found.
            if (ex instanceof WorkflowStateNotFoundError) {
                return;
            }
            throw ex;
        }
        throw new WebinyError(
            "Cannot publish page because its workflow state is not completed.",
            "WORKFLOW_STATE_NOT_COMPLETED",
            {
                pageId: page.id,
                state: {
                    ...state
                }
            }
        );
    });
};
