import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachDeleteEntryLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryAfterDelete.subscribe(async ({ model, entry, permanent }) => {
        if (model.isPrivate || !permanent) {
            return;
        }
        const app = createWorkflowAppName({ model });
        try {
            await context.workflowState.deleteState(app, entry.id);
        } catch (ex) {
            console.error(ex);
        }
    });
};
