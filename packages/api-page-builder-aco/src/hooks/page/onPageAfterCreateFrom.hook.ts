import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { PB_PAGE_TYPE } from "~/contants";
import { Context, PbPageRecordData } from "~/types";

export const onPageAfterCreateFromHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        try {
            pageBuilder.onPageAfterCreateFrom.subscribe(async ({ original, page }) => {
                const {
                    id,
                    pid,
                    title,
                    content,
                    createdOn,
                    createdBy,
                    savedOn,
                    status,
                    version,
                    locked
                } = page;

                const originalRecord = await aco.search.get<PbPageRecordData>(original.pid);

                await aco.search.create<PbPageRecordData>({
                    originalId: pid,
                    title: title,
                    type: PB_PAGE_TYPE,
                    content: content?.content,
                    location: originalRecord.location,
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
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreateFromHook hook",
                code: "ACO_AFTER_PAGE_CREATE_FROM_HOOK"
            });
        }
    });
};
