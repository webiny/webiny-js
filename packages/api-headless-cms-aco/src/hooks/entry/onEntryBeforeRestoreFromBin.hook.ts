import { HcmsAcoContext } from "~/types";
import WebinyError from "@webiny/error";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants";

export const onEntryBeforeRestoreFromBinHook = (context: HcmsAcoContext) => {
    const { aco, cms } = context;

    cms.onEntryBeforeRestoreFromBin.subscribe(async ({ entry }) => {
        /**
         * Skip further execution if folderId is falsy or equals ROOT_FOLDER.
         */
        if (!entry.location?.folderId || entry.location.folderId === ROOT_FOLDER) {
            return;
        }

        try {
            /**
             * Retrieve the folder: if it exists, no additional operations are necessary.
             */
            await aco.folder.get(entry.location.folderId);
            return;
        } catch (error) {
            /**
             * If the folder is not found, set ROOT_FOLDER as the location.
             */
            if (error.code === "NOT_FOUND") {
                entry.location.folderId = ROOT_FOLDER;
                return;
            }

            throw WebinyError.from(error, {
                message: "Error while executing onEntryBeforeRestoreFromBin hook",
                code: "HCMS_ACO_BEFORE_RESTORE_FROM_BIN_HOOK"
            });
        }
    });
};
