import type { Context } from "~/types.js";
import { WB_PAGE_APP } from "~/constants.js";

interface IParams {
    context: Pick<Context, "workflowState" | "websiteBuilder">;
}

export const attachDeletePageLifecycleEvents = (params: IParams) => {
    const { context } = params;
    context.websiteBuilder.pages.onPageBeforeDelete.subscribe(async ({ page }) => {
        try {
            await context.workflowState.deleteTargetState(WB_PAGE_APP, page.id);
        } catch {
            // does not matter
        }
    });
};
