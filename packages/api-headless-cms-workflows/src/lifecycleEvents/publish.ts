import type { Context } from "~/types.js";
import { createWorkflowAppName } from "~/utils/createWorkflowAppName.js";

interface IParams {
    context: Context;
}

export const attachPublishLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.cms.onEntryBeforePublish.subscribe(async ({ model, entry, original }) => {
        const app = createWorkflowAppName({ model });
        const manager = context.workflows.stateManager(app, entry.id);
        // thinking of always returning the state object
        const state = await manager.getState();
        if (state.done) {
            return;
        }
        throw new Error("Cannot publish entry because its workflow is not completed.");
    });
};
