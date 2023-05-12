import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";
import { PB_PAGE_TYPE } from "~/contants";

export const onPageAfterPublishHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;

    const app = aco.getApp(PB_PAGE_TYPE);
    /**
     * Intercept page publish event and update the related search record.
     */
    pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
        try {
            const payload = await updatePageRecordPayload(context, page);
            await app.search.update<PbPageRecordData>(page.pid, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterPublishHook hook",
                code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
            });
        }
    });
};
