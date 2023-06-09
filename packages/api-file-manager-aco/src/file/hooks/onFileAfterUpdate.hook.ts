import WebinyError from "@webiny/error";

import { updatePageRecordPayload } from "../../utils/createRecordPayload";

import { FmAcoContext, FmFileRecordData } from "~/types";
import { FM_FILE_TYPE } from "~/contants";

export const onFileAfterUpdateHook = ({ aco, fileManager }: FmAcoContext) => {
    /**
     * Intercept file update event and update the related search record.
     */
    fileManager.onFileAfterUpdate.subscribe(async ({ file }) => {
        const app = aco.getApp(FM_FILE_TYPE);
        try {
            const payload = await updatePageRecordPayload(file);
            await app.search.update<FmFileRecordData>(file.id, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterUpdateHook hook",
                code: "ACO_AFTER_FILE_UPDATE_HOOK"
            });
        }
    });
};
