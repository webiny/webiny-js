import { ContextPlugin } from "@webiny/api";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

export const createPageLifecycleHook = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageBeforeUpdate.subscribe(async ({ page, input }) => {
            if (input.customViews === undefined) {
                return;
            }
            page.settings.customViews = input.customViews || 0;
        });
    });
};
