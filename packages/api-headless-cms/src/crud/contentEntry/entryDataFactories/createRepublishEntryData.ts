import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { getDate } from "~/utils/date";
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
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */
        publishedOn: getDate(originalEntry.publishedOn, currentDateTime),
        savedOn: getDate(originalEntry.savedOn, currentDateTime),

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */

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

        /**
         * Entry-level meta fields. 👇
         */
        entrySavedOn: currentDateTime,
        entryModifiedOn: currentDateTime,
        entrySavedBy: currentIdentity,
        entryModifiedBy: currentIdentity,
        entryFirstPublishedOn: originalEntry.entryFirstPublishedOn || currentDateTime,
        entryFirstPublishedBy: originalEntry.entryFirstPublishedBy || currentIdentity,
        entryLastPublishedOn: currentDateTime,
        entryLastPublishedBy: currentIdentity,

        webinyVersion: context.WEBINY_VERSION,
        values
    };

    return { entry };
};
