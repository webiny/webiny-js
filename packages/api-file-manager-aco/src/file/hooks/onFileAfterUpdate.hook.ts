import WebinyError from "@webiny/error";

import { createFileRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";

export const onFileAfterUpdateHook = ({ aco, fileManager }: FmAcoContext) => {
    /**
     * Intercept page update event and update the related search record.
     */
    fileManager.onFileAfterUpdate.subscribe(async ({ file }) => {
        try {
            const payload = createFileRecordPayload(file);
            await aco.search.create<FmFileRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterCreateHook hook",
                code: "ACO_AFTER_FILE_CREATE_HOOK"
            });
        }
    });
};
