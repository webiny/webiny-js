import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterUpdateHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;

    /**
     * Intercept page update event and update the related search record.
     */
    pageBuilder.onPageAfterUpdate.subscribe(async ({ page, meta }) => {
        try {
            const payload = await updatePageRecordPayload(context, page, meta);
            await aco.search.update<PbPageRecordData>(page.pid, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUpdateHook hook",
                code: "ACO_AFTER_PAGE_UPDATE_HOOK"
            });
        }
    });
};
