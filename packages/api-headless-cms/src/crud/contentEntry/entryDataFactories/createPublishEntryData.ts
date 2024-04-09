import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";
import { getIdentity } from "~/utils/identity";
import { getDate } from "~/utils/date";

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
        createdOn: getDate(latestEntry.createdOn),
        modifiedOn: getDate(currentDateTime),
        savedOn: getDate(currentDateTime),
        firstPublishedOn: getDate(latestEntry.firstPublishedOn, currentDateTime),
        lastPublishedOn: getDate(currentDateTime),
        createdBy: getIdentity(latestEntry.createdBy),
        modifiedBy: getIdentity(currentIdentity),
        savedBy: getIdentity(currentIdentity),
        firstPublishedBy: getIdentity(latestEntry.firstPublishedBy, currentIdentity),
        lastPublishedBy: getIdentity(currentIdentity),

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(originalEntry.revisionCreatedOn),
        revisionSavedOn: getDate(currentDateTime),
        revisionModifiedOn: getDate(currentDateTime),
        revisionFirstPublishedOn: getDate(originalEntry.revisionFirstPublishedOn, currentDateTime),
        revisionLastPublishedOn: getDate(currentDateTime),
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
