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
        console.log({
            state: {
                id: state.id,
                app: state.app,
                state: state.state,
                comment: state.comment,
                targetRevisionId: state.targetRevisionId,
                steps: state.steps
            }
        });
        throw new WebinyError({
            message: "Cannot update page because it has a workflow attached.",
            code: "PAGE_IN_WORKFLOW",
            data: {
                state: {
                    id: state.id,
                    app: state.app,
                    state: state.state,
                    comment: state.comment,
                    targetRevisionId: state.targetRevisionId,
                    steps: state.steps,
                    title: state.title
                }
            }
        });
    });
};
