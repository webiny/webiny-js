import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";

type CreatePublishEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
    latestEntry: CmsEntry;
};

export const createPublishEntryData = async ({
    model,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry,
    latestEntry
}: CreatePublishEntryDataParams): Promise<{
    entry: CmsEntry;
}> => {
    await validateModelEntryDataOrThrow({
        context,
        model,
        data: originalEntry.values,
        entry: originalEntry
    });

    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry = {
        ...originalEntry,
        status: STATUS_PUBLISHED,
        locked: true,

        /**
         * Entry-level meta fields. 👇
         */
        createdOn: latestEntry.createdOn,
        modifiedOn: currentDateTime,
        savedOn: currentDateTime,
        firstPublishedOn: latestEntry.firstPublishedOn || currentDateTime,
        lastPublishedOn: currentDateTime,
        createdBy: latestEntry.createdBy,
        modifiedBy: currentIdentity,
        savedBy: currentIdentity,
        firstPublishedBy: latestEntry.firstPublishedBy || currentIdentity,
        lastPublishedBy: currentIdentity,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: originalEntry.revisionCreatedOn,
        revisionSavedOn: currentDateTime,
        revisionModifiedOn: currentDateTime,
        revisionFirstPublishedOn: originalEntry.revisionFirstPublishedOn || currentDateTime,
        revisionLastPublishedOn: currentDateTime,
        revisionCreatedBy: originalEntry.revisionCreatedBy,
        revisionSavedBy: currentIdentity,
        revisionModifiedBy: currentIdentity,
        revisionFirstPublishedBy: originalEntry.revisionFirstPublishedBy || currentIdentity,
        revisionLastPublishedBy: currentIdentity
    };

    return { entry };
};
