import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterPublishHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;

    /**
     * Intercept page publish event and update the related search record.
     */
    pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
        try {
            const payload = await updatePageRecordPayload(context, page);
            await aco.search.update<PbPageRecordData>(page.pid, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterPublishHook hook",
                code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
            });
        }
    });
};
