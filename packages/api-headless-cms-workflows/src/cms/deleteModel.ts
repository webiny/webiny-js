import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";

interface IParams {
    context: Pick<Context, "workflows" | "cms">;
}

export const attachDeleteModelLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onModelAfterDelete.subscribe(async ({ model }) => {
        if (model.isPrivate || model.isPlugin) {
            return;
        }
        const app = createWorkflowAppName({ model });
        const workflows = await context.workflows.listWorkflows({
            where: {
                app
            },
            limit: 10000
        });
        for (const workflow of workflows.items) {
            try {
                await context.workflows.deleteWorkflow(workflow.app, workflow.id);
            } catch (ex) {
                console.error(ex);
            }
        }
    });
};
