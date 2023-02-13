import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { createPageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterCreateHook = () => {
    return new ContextPlugin<PbAcoContext>(async ({ pageBuilder, aco }) => {
        /**
         * Intercept page creation and create a new search record.
         * The `location.folderId` info is coming from transient `meta` data.
         */
        pageBuilder.onPageAfterCreate.subscribe(async ({ page, meta }) => {
            try {
                const payload = createPageRecordPayload(page, meta?.location?.folderId);
                await aco.search.create<PbPageRecordData>(payload);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterCreateHook hook",
                    code: "ACO_AFTER_PAGE_CREATE_HOOK"
                });
            }
        });
    });
};
