import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping";
import { STATUS_PUBLISHED } from "./statuses";
import { SecurityIdentity } from "@webiny/api-security/types";
import { getIdentity } from "~/utils/identity";
import { getDate } from "~/utils/date";

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
        savedOn: getDate(currentDateTime),
        modifiedOn: getDate(currentDateTime),
        savedBy: getIdentity(currentIdentity),
        modifiedBy: getIdentity(currentIdentity),
        firstPublishedOn: getDate(originalEntry.firstPublishedOn, currentDateTime),
        firstPublishedBy: getIdentity(originalEntry.firstPublishedBy, currentIdentity),
        lastPublishedOn: getDate(currentDateTime),
        lastPublishedBy: getIdentity(currentIdentity),

        /**
         * Revision-level meta fields. 👇
         */
        revisionSavedOn: getDate(currentDateTime),
        revisionModifiedOn: getDate(currentDateTime),
        revisionSavedBy: getIdentity(currentIdentity),
        revisionModifiedBy: getIdentity(currentIdentity),
        revisionFirstPublishedOn: getDate(originalEntry.revisionFirstPublishedOn, currentDateTime),
        revisionFirstPublishedBy: getIdentity(
            originalEntry.revisionFirstPublishedBy,
            currentIdentity
        ),
        revisionLastPublishedOn: getDate(currentDateTime),
        revisionLastPublishedBy: getIdentity(currentIdentity),

        webinyVersion: context.WEBINY_VERSION,
        values
    };

    return { entry };
};
