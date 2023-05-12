import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterCreateFromHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;

    /**
     * Intercept page revision creation and update the related record.
     * Here we perform an update since all the page revisions are related to the same search record entry.
     */
    pageBuilder.onPageAfterCreateFrom.subscribe(async ({ page }) => {
        try {
            const payload = await updatePageRecordPayload(context, page);
            await aco.search.update<PbPageRecordData>(page.pid, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreateFromHook hook",
                code: "ACO_AFTER_PAGE_CREATE_FROM_HOOK"
            });
        }
    });
};
