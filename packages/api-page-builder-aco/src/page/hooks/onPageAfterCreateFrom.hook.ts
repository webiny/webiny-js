import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterCreateFromHook = () => {
    return new ContextPlugin<PbAcoContext>(async context => {
        const { aco, pageBuilder } = context;

        /**
         * Intercept page revision creation and update the related record.
         * Here we perform an update since all the page revisions are related to the same search record entry.
         */
        pageBuilder.onPageAfterCreateFrom.subscribe(async ({ original, page }) => {
            try {
                const { location } = await aco.search.get<PbPageRecordData>(original.pid);

                const payload = await updatePageRecordPayload(context, page, {
                    location
                });
                await aco.search.update<PbPageRecordData>(page.pid, payload);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterCreateFromHook hook",
                    code: "ACO_AFTER_PAGE_CREATE_FROM_HOOK"
                });
            }
        });
    });
};
