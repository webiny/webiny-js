import WebinyError from "@webiny/error";

import { createFileRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";

export const onFileAfterCreateHook = (context: FmAcoContext) => {
    const { aco, fileManager } = context;

    /**
     * Intercept file creation and create a new search record.
     */
    fileManager.onFileAfterCreate.subscribe(async ({ file }) => {
        try {
            console.log("file", file);
            const payload = createFileRecordPayload(context, file);
            await aco.search.create<FmFileRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterCreateHook hook",
                code: "ACO_AFTER_FILE_CREATE_HOOK"
            });
        }
    });
};
