import type { CmsContext, CmsEntry, CmsEntryValues, CmsModel } from "~/types";
import { STATUS_PUBLISHED } from "./statuses";
import type { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";
import { getIdentity } from "~/utils/identity";
import { getDate } from "~/utils/date";
import { createState } from "~/crud/contentEntry/entryDataFactories/state.js";

type CreatePublishEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
    latestEntry: CmsEntry;
};

export const createPublishEntryData = async <T extends CmsEntryValues = CmsEntryValues>({
    model,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry,
    latestEntry
}: CreatePublishEntryDataParams): Promise<{
    entry: CmsEntry<T>;
}> => {
    await validateModelEntryDataOrThrow({
        context,
        model,
        data: originalEntry.values,
        entry: originalEntry
    });

    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry<T> = {
        ...originalEntry,
        status: STATUS_PUBLISHED,
        state: createState(undefined),
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
    } as CmsEntry<T>;

    return { entry };
};
