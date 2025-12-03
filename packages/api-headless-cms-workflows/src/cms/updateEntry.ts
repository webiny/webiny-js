import { IWorkflowState } from "@webiny/api-workflows";
import { WebinyError } from "@webiny/error";
import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachUpdateEntryLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryBeforeUpdate.subscribe(async ({ model, entry }) => {
        if (isModelAllowed(model) === false) {
            return;
        }
        const app = createWorkflowAppName({ model });
        let state: IWorkflowState;
        try {
            state = await context.workflowState.getTargetState(app, entry.id);
        } catch {
            // does not matter
            return;
        }
        throw new WebinyError({
            message: "Cannot update entry because it is currently in a workflow.",
            code: "ENTRY_IN_WORKFLOW",
            data: {
                state: {
                    ...state
                }
            }
        });
    });
};
