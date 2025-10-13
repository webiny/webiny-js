import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { getState } from "~/utils/state.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachCreateLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryBeforeCreate.subscribe(async ({ model, entry }) => {
        if (!model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        const state = await context.workflowState.createState(app, entry.id);

        entry.state = getState(state);
    });

    context.cms.onEntryCreateError.subscribe(async ({ model, entry }) => {
        if (!model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        try {
            await context.workflowState.deleteState(app, entry.id);
        } catch (ex) {
            console.error(ex);
        }
    });

    context.cms.onEntryRevisionBeforeCreate.subscribe(async ({ model, entry }) => {
        if (!model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        const state = await context.workflowState.createState(app, entry.id);
        entry.state = getState(state);
    });

    context.cms.onEntryRevisionCreateError.subscribe(async ({ model, entry }) => {
        if (!model.isPrivate) {
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
