import WebinyError from "@webiny/error";

import { createFileRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";
import { FM_FILE_TYPE } from "~/contants";

export const onFileAfterCreateHook = ({ fileManager, aco }: FmAcoContext) => {
    /**
     * Intercept file creation and create a new search record.
     */
    fileManager.onFileAfterCreate.subscribe(async ({ file, meta }) => {
        const app = aco.getApp(FM_FILE_TYPE);
        try {
            if (file.meta.private) {
                // Skipping ACO search record creation while file is marked as private
                return;
            }
            const payload = createFileRecordPayload(file, meta);
            await app.search.create<FmFileRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterCreateHook hook",
                code: "ACO_AFTER_FILE_CREATE_HOOK"
            });
        }
    });
};
