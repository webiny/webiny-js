import { ContextPlugin } from "@webiny/api";
import { OnPageAfterUpdateTopicParams, PbContext } from "@webiny/api-page-builder/graphql/types";
import { CustomFieldsPage } from "~tests/types";

export const createPageLifecycleHook = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageAfterUpdate.subscribe<
            OnPageAfterUpdateTopicParams<CustomFieldsPage>
        >(async ({ page, input }) => {
            if (input.customViews === undefined) {
                return;
            }
            page.customViews = input.customViews || 0;
        });
    });
};
