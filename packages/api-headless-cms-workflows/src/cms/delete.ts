import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachDeleteLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryAfterDelete.subscribe(async ({ model, entry, permanent }) => {
        if (!permanent || !model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        await context.workflowState.deleteState(app, entry.id);
    });
};
