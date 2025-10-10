import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/createWorkflowAppName.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachCreateLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryAfterCreate.subscribe(async ({ model, entry }) => {
        const app = createWorkflowAppName({ model });
        await context.workflowState.createState(app, entry.id);
    });

    context.cms.onEntryRevisionAfterCreate.subscribe(async ({ model, entry }) => {
        const app = createWorkflowAppName({ model });
        await context.workflowState.createState(app, entry.id);
    });
};
