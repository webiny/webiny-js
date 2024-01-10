import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";

type CreateRepublishEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
};

export const createRepublishEntryData = async ({
    model,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateRepublishEntryDataParams): Promise<{
    entry: CmsEntry;
}> => {
    const values = await referenceFieldsMapping({
        context,
        model,
        input: originalEntry.values,
        validateEntries: false
    });

    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry = {
        ...originalEntry,
        status: STATUS_PUBLISHED,

        /**
         * Entry-level meta fields. 👇
         */
        savedOn: currentDateTime,
        modifiedOn: currentDateTime,
        savedBy: currentIdentity,
        modifiedBy: currentIdentity,
        firstPublishedOn: originalEntry.firstPublishedOn || currentDateTime,
        firstPublishedBy: originalEntry.firstPublishedBy || currentIdentity,
        lastPublishedOn: currentDateTime,
        lastPublishedBy: currentIdentity,

        /**
         * Revision-level meta fields. 👇
         */
        revisionSavedOn: currentDateTime,
        revisionModifiedOn: currentDateTime,
        revisionSavedBy: currentIdentity,
        revisionModifiedBy: currentIdentity,
        revisionFirstPublishedOn: originalEntry.revisionFirstPublishedOn || currentDateTime,
        revisionFirstPublishedBy: originalEntry.revisionFirstPublishedBy || currentIdentity,
        revisionLastPublishedOn: currentDateTime,
        revisionLastPublishedBy: currentIdentity,

        webinyVersion: context.WEBINY_VERSION,
        values
    };

    return { entry };
};
