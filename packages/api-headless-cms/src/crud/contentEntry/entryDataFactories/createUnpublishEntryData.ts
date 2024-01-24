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
         * Entry-level meta fields. 👇
         */
        savedOn: currentDateTime,
        modifiedOn: currentDateTime,
        savedBy: currentIdentity,
        modifiedBy: currentIdentity,

        /**
         * Revision-level meta fields. 👇
         */
        revisionSavedOn: currentDateTime,
        revisionModifiedOn: currentDateTime,
        revisionSavedBy: currentIdentity,
        revisionModifiedBy: currentIdentity
    };

    return { entry };
};
