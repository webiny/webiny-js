import type { CmsContext, CmsEntry, CmsModel } from "~/types/index.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { STATUS_PUBLISHED } from "./statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

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
        savedBy: getIdentity(currentIdentity)!,
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
        revisionSavedBy: getIdentity(currentIdentity)!,
        revisionModifiedBy: getIdentity(currentIdentity),
        revisionFirstPublishedOn: getDate(originalEntry.revisionFirstPublishedOn, currentDateTime),
        revisionFirstPublishedBy: getIdentity(
            originalEntry.revisionFirstPublishedBy,
            currentIdentity
        ),
        revisionLastPublishedOn: getDate(currentDateTime),
        revisionLastPublishedBy: getIdentity(currentIdentity),
        values
    };

    return { entry };
};
