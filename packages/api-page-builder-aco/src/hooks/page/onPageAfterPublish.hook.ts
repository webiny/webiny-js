import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context, PbPageRecordData } from "~/types";

export const onPageAfterPublishHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
            try {
                const { id, pid, createdOn, createdBy, savedOn, status, version, locked } = page;

                await aco.search.update<PbPageRecordData>(pid, {
                    data: {
                        id,
                        createdBy,
                        createdOn,
                        savedOn,
                        status,
                        version,
                        locked
                    }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onPageAfterPublishHook hook",
                    code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
                });
            }
        });
    });
};
