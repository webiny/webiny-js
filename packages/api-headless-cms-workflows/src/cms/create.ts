import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/appName.js";
import { getState } from "~/utils/state.js";

interface IParams {
    context: Pick<Context, "workflowState" | "cms">;
}

export const attachCreateLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryAfterCreate.subscribe(async ({ model, entry, storageEntry }) => {
        if (!model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        const state = await context.workflowState.createState(app, entry.id);

        entry.state = getState(state);
        storageEntry.state = getState(state);
    });

    context.cms.onEntryRevisionAfterCreate.subscribe(async ({ model, entry, storageEntry }) => {
        if (!model.isPrivate) {
            return;
        }
        const app = createWorkflowAppName({ model });
        const state = await context.workflowState.createState(app, entry.id);
        entry.state = getState(state);
        storageEntry.state = getState(state);
    });
};
