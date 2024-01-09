import { CmsContext, CmsEntry, CmsModel, CmsPublishEntryOptions } from "~/types";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";

type CreatePublishEntryDataParams = {
    model: CmsModel;
    options?: CmsPublishEntryOptions;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
    latestEntry: CmsEntry;
};

export const createPublishEntryData = async ({
    model,
    options,
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

    /**
     * The existing functionality is to set the publishedOn date to the current date.
     * Users can now choose to skip updating the publishedOn date - unless it is not set.
     *
     * Same logic goes for the savedOn date.
     */
    const { updatePublishedOn = true, updateSavedOn = true } = options || {};
    let publishedOn = originalEntry.publishedOn;
    if (updatePublishedOn || !publishedOn) {
        publishedOn = currentDateTime;
    }

    let savedOn = originalEntry.savedOn;
    if (updateSavedOn || !savedOn) {
        savedOn = currentDateTime;
    }

    const entry: CmsEntry = {
        ...originalEntry,
        status: STATUS_PUBLISHED,
        locked: true,

        /**
         * 🔀 Alias meta fields below.
         */
        savedOn,
        publishedOn,

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */

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
        revisionLastPublishedBy: currentIdentity,

        /**
         * Entry-level meta fields. 👇
         */
        entryCreatedOn: latestEntry.entryCreatedOn,
        entrySavedOn: currentDateTime,
        entryModifiedOn: currentDateTime,
        entryFirstPublishedOn: latestEntry.entryFirstPublishedOn || currentDateTime,
        entryLastPublishedOn: currentDateTime,
        entryCreatedBy: latestEntry.entryCreatedBy,
        entrySavedBy: currentIdentity,
        entryModifiedBy: currentIdentity,
        entryFirstPublishedBy: latestEntry.entryFirstPublishedBy || currentIdentity,
        entryLastPublishedBy: currentIdentity
    };

    return { entry };
};
