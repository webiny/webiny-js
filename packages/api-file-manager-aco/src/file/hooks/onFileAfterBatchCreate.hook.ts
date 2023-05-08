import WebinyError from "@webiny/error";

import { createFileRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";

export const onFileAfterBatchCreateHook = ({ fileManager, aco }: FmAcoContext) => {
    /**
     * Intercept file batch creation and create a new search records.
     */
    fileManager.onFileAfterBatchCreate.subscribe(async ({ files, meta }) => {
        try {
            for (const file of files) {
                if (file.meta.private) {
                    console.log(
                        `Skipping ACO search record, the file ${file.name} is marked as "private"`
                    );
                    continue;
                }
                const payload = createFileRecordPayload(file, meta);
                await aco.search.create<FmFileRecordData>(payload);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterBatchCreateHook hook",
                code: "ACO_AFTER_FILE_BATCH_CREATE_HOOK"
            });
        }
    });
};
