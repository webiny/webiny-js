import { WebinyError } from "@webiny/error";
import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";
import type { IWorkflowState } from "@webiny/api-workflows";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachPublishEntryLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryBeforePublish.subscribe(async ({ model, entry }) => {
        if (isModelAllowed(model) === false) {
            return;
        }
        const app = createWorkflowAppName({ model });

        let state: IWorkflowState | undefined = undefined;
        try {
            state = await context.workflowState.getTargetState(app, entry.id);
            if (state?.done) {
                entry.state = undefined;
                return;
            }
        } catch {
            // does not matter
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
