import { WebinyError } from "@webiny/error";
import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/createWorkflowAppName.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachPublishLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryBeforePublish.subscribe(async ({ model, entry }) => {
        const app = createWorkflowAppName({ model });
        const state = await context.workflowState.getState(app, entry.id);
        if (state.done) {
            return;
        }
        throw new WebinyError(
            "Cannot publish entry because its workflow is not completed.",
            "WORKFLOW_NOT_COMPLETED",
            {
                app,
                entryId: entry.id,
                workflowId: state.workflow?.id
            }
        );
    });
};
