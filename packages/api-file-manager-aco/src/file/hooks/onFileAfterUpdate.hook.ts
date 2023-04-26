import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";

export const onFileAfterUpdateHook = ({ aco, fileManager }: FmAcoContext) => {
    /**
     * Intercept page update event and update the related search record.
     */
    fileManager.onFileAfterUpdate.subscribe(async ({ file }) => {
        try {
            const payload = await updatePageRecordPayload(file);
            await aco.search.update<FmFileRecordData>(file.id, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterUpdateHook hook",
                code: "ACO_AFTER_FILE_UPDATE_HOOK"
            });
        }
    });
};
