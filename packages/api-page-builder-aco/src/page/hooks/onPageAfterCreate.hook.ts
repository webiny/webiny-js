import WebinyError from "@webiny/error";

import { createPageRecordPayload } from "~/utils/createRecordPayload";

import { PbAcoContext, PbPageRecordData } from "~/types";

export const onPageAfterCreateHook = (context: PbAcoContext) => {
    const { aco, pageBuilder } = context;

    /**
     * Intercept page creation and create a new search record.
     * The `location.folderId` info is coming from transient `meta` data.
     */
    pageBuilder.onPageAfterCreate.subscribe(async ({ page, meta }) => {
        try {
            const payload = await createPageRecordPayload(context, page, meta);
            await aco.search.create<PbPageRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreateHook hook",
                code: "ACO_AFTER_PAGE_CREATE_HOOK"
            });
        }
    });
};
