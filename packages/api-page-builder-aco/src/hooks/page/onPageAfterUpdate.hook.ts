import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterUpdateHook = () => {
    return new ContextPlugin<PbAcoContext>(async ({ pageBuilder, aco, pageBuilderAco }) => {
        /**
         * Intercept page update event and update the related search record.
         */
        pageBuilder.onPageAfterUpdate.subscribe(async ({ page, meta }) => {
            try {
                const processedPage = await pageBuilderAco.processPageContent(page);

                console.log("processedPage page", processedPage);

                const payload = updatePageRecordPayload(page, meta?.location?.folderId);
                await aco.search.update<PbPageRecordData>(page.pid, payload);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterUpdateHook hook",
                    code: "ACO_AFTER_PAGE_UPDATE_HOOK"
                });
            }
        });
    });
};
