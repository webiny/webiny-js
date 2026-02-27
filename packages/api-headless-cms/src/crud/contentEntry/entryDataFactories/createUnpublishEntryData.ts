import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import { STATUS_UNPUBLISHED } from "./statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

interface CreateRepublishEntryDataParams<TValues extends CmsEntryValues = CmsEntryValues> {
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry<TValues>;
}

interface ICreateUnpublishEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
}

export const createUnpublishEntryData = async <TValues extends CmsEntryValues = CmsEntryValues>({
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateRepublishEntryDataParams<TValues>): Promise<
    ICreateUnpublishEntryDataResponse<TValues>
> => {
    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry<TValues> = {
        ...originalEntry,
        status: STATUS_UNPUBLISHED,

        /**
         * Entry-level meta fields. 👇
         */
        savedOn: getDate(currentDateTime),
        modifiedOn: getDate(currentDateTime),
        savedBy: getIdentity(currentIdentity),
        modifiedBy: getIdentity(currentIdentity),

        /**
         * Revision-level meta fields. 👇
         */
        revisionSavedOn: getDate(currentDateTime),
        revisionModifiedOn: getDate(currentDateTime),
        revisionSavedBy: getIdentity(currentIdentity),
        revisionModifiedBy: getIdentity(currentIdentity),
        live: false
    };

    return {
        entry
    };
};
