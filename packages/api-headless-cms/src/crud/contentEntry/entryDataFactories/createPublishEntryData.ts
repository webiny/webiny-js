import type { CmsContext, CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_PUBLISHED } from "./statuses.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

interface ICreatePublishEntryDataParams<TValues extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry<TValues>;
    latestEntry: CmsEntry<TValues>;
}

interface ICreatePublishEntryDataResponse<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<T>;
}

export const createPublishEntryData = async <T extends CmsEntryValues = CmsEntryValues>({
    model,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry,
    latestEntry
}: ICreatePublishEntryDataParams<T>): Promise<ICreatePublishEntryDataResponse<T>> => {
    await validateModelEntryDataOrThrow({
        context,
        model,
        values: originalEntry.values,
        entry: originalEntry
    });

    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry<T> = {
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
