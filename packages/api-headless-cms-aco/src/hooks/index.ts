import WebinyError from "@webiny/error";
import { CmsContext } from "@webiny/api-headless-cms/types";

export const attachHooks = (context: CmsContext): void => {
    context.cms.onEntryBeforeCreate.subscribe(async ({ entry, input }) => {
        /**
         * No need to do anything if there is no location attached.
         */
        if (!input.wby_location) {
            return;
        }
        const folderId = input.wby_location?.folderId;
        if (!folderId) {
            throw new WebinyError(
                `Missing "folderId" in "wby_location" input.`,
                "MISSING_FOLDER_ID",
                {
                    input
                }
            );
        }
        entry.meta = {
            ...(entry.meta || {}),
            location: {
                ...(entry.meta?.location || {}),
                folderId
            }
        };
    });
};
