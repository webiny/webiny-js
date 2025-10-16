import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { isModelAllowed } from "~/utils/modelAllowed.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachDeleteEntryLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryAfterDelete.subscribe(async ({ model, entry, permanent }) => {
        if (isModelAllowed(model) === false || !permanent) {
            return;
        }
        const app = createWorkflowAppName({ model });
        try {
            await context.workflowState.deleteTargetState(app, entry.id);
        } catch (ex) {
            console.error(ex);
        }
    });
};
