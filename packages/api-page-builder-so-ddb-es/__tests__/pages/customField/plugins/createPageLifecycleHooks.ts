import { ContextPlugin } from "@webiny/api";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

/**
 * This part serves as the transfer of customViews input to the page settings.
 * This should not be used in production environment as anyone can change the view count.
 */
export const createPageLifecycleHook = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageBeforeUpdate.subscribe(async ({ page, input }) => {
            if (input.customViews === undefined) {
                return;
            }
            /**
             * We need to make sure that a number type goes into the settings.
             * This is very important for the Elasticsearch, because if the customViews is a string - sorting and filtering will not work properly.
             */
            page.settings.customViews = Number(input.customViews || 0);
        });
    });
};
