import WebinyError from "@webiny/error";
import { createFileRecordPayload } from "../../utils/createRecordPayload";
import { FmAcoContext, FmFileRecordData } from "~/types";
import { FM_FILE_TYPE } from "~/contants";

export const onFileAfterBatchCreateHook = ({ fileManager, aco }: FmAcoContext) => {
    /**
     * Intercept file batch creation and create a new search records.
     */
    fileManager.onFileAfterBatchCreate.subscribe(async ({ files, meta }) => {
        const app = aco.getApp(FM_FILE_TYPE);
        try {
            for (const file of files) {
                if (file.meta.private) {
                    // Skipping ACO search record creation while file is marked as private
                    continue;
                }
                const payload = createFileRecordPayload(file, meta);
                await app.search.create<FmFileRecordData>(payload);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterBatchCreateHook hook",
                code: "ACO_AFTER_FILE_BATCH_CREATE_HOOK"
            });
        }
    });
};
