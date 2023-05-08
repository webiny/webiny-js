import WebinyError from "@webiny/error";

import { createFileRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";

export const onFileAfterCreateHook = ({ fileManager, aco }: FmAcoContext) => {
    /**
     * Intercept file creation and create a new search record.
     */
    fileManager.onFileAfterCreate.subscribe(async ({ file, meta }) => {
        try {
            if (file.meta.private) {
                console.log(
                    `Skipping ACO search record, the file ${file.name} is marked as "private"`
                );
                return;
            }
            const payload = createFileRecordPayload(file, meta);
            await aco.search.create<FmFileRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterCreateHook hook",
                code: "ACO_AFTER_FILE_CREATE_HOOK"
            });
        }
    });
};
