import WebinyError from "@webiny/error";

import { PbAcoContext, PbPageRecordData } from "~/types";
import { PB_PAGE_TYPE } from "~/contants";
import { updatePageRecordPayload } from "~/utils/createRecordPayload";

export const onPageAfterDeleteHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;
    const app = aco.getApp(PB_PAGE_TYPE);

    /**
     * Intercept page deletion and delete or update the related search record.
     */
    pageBuilder.onPageAfterDelete.subscribe(async ({ page, deleteMethod, latestPage }) => {
        // If the deleteMethod is "deleteAll" delete the search record.
        if (deleteMethod === "deleteAll") {
            try {
                await app.search.delete(page.pid);
            } catch (error) {
                // If the search record is not found, return without further action.
                if (error.code === "NOT_FOUND") {
                    return;
                }
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterDeleteHook hook.",
                    code: "ACO_AFTER_PAGE_DELETE_HOOK"
                });
            }
            return;
        }

        try {
            if (latestPage) {
                // Update the search record with the latest page data.
                const payload = await updatePageRecordPayload(context, latestPage);
                await app.search.update<PbPageRecordData>(page.pid, payload);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterDeleteHook hook.",
                code: "ACO_AFTER_PAGE_DELETE_HOOK"
            });
        }
    });
};
