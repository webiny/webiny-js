import WebinyError from "@webiny/error";

import { FmAcoContext } from "~/types";
import { FM_FILE_TYPE } from "~/contants";

export const onFileAfterDeleteHook = ({ fileManager, aco }: FmAcoContext) => {
    /**
     * Intercept file deletion and delete the related search record.
     */
    fileManager.onFileAfterDelete.subscribe(async ({ file }) => {
        const app = aco.getApp(FM_FILE_TYPE);
        try {
            await app.search.delete(file.id);
        } catch (error) {
            if (error.code === "NOT_FOUND") {
                return;
            }

            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterDeleteHook hook",
                code: "ACO_AFTER_FILE_DELETE_HOOK"
            });
        }
    });
};
