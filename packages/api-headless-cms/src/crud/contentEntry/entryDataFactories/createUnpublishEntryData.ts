import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { STATUS_UNPUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";

type CreateRepublishEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
};

export const createUnpublishEntryData = async ({
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateRepublishEntryDataParams): Promise<{
    entry: CmsEntry;
}> => {
    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry = {
        ...originalEntry,
        status: STATUS_UNPUBLISHED,

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         * We want to update savedX and modifiedX fields on both revision and entry levels.
         */

        /**
         * Revision-level meta fields. 👇
         */
        revisionSavedOn: currentDateTime,
        revisionModifiedOn: currentDateTime,
        revisionSavedBy: currentIdentity,
        revisionModifiedBy: currentIdentity,

        /**
         * Entry-level meta fields. 👇
         */
        entrySavedOn: currentDateTime,
        entryModifiedOn: currentDateTime,
        entrySavedBy: currentIdentity,
        entryModifiedBy: currentIdentity
    };

    return { entry };
};
