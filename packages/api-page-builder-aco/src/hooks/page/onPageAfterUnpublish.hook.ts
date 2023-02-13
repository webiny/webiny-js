import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterUnpublishHook = () => {
    return new ContextPlugin<PbAcoContext>(async ({ pageBuilder, aco }) => {
        /**
         * Intercept page un-publish event and update the related search record.
         */
        pageBuilder.onPageAfterUnpublish.subscribe(async ({ page }) => {
            try {
                const payload = updatePageRecordPayload(page);
                await aco.search.update<PbPageRecordData>(page.pid, payload);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterUnpublishHook hook",
                    code: "ACO_AFTER_PAGE_UNPUBLISH_HOOK"
                });
            }
        });
    });
};
