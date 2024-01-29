import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";
import { getIdentity } from "~/utils/identity";

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
        createdBy: getIdentity(latestEntry.createdBy),
        modifiedBy: getIdentity(currentIdentity),
        savedBy: getIdentity(currentIdentity),
        firstPublishedBy: getIdentity(latestEntry.firstPublishedBy, currentIdentity),
        lastPublishedBy: getIdentity(currentIdentity),

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: originalEntry.revisionCreatedOn,
        revisionSavedOn: currentDateTime,
        revisionModifiedOn: currentDateTime,
        revisionFirstPublishedOn: originalEntry.revisionFirstPublishedOn || currentDateTime,
        revisionLastPublishedOn: currentDateTime,
        revisionCreatedBy: getIdentity(originalEntry.revisionCreatedBy),
        revisionSavedBy: getIdentity(currentIdentity),
        revisionModifiedBy: getIdentity(currentIdentity),
        revisionFirstPublishedBy: getIdentity(
            originalEntry.revisionFirstPublishedBy,
            currentIdentity
        ),
        revisionLastPublishedBy: getIdentity(currentIdentity)
    };

    return { entry };
};
