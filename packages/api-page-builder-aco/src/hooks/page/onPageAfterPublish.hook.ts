import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterPublishHook = () => {
    return new ContextPlugin<PbAcoContext>(async ({ pageBuilder, aco }) => {
        /**
         * Intercept page publish event and update the related search record.
         */
        pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
            try {
                const payload = updatePageRecordPayload(page);
                await aco.search.update<PbPageRecordData>(page.pid, payload);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterPublishHook hook",
                    code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
                });
            }
        });
    });
};
