import type { CmsContext, CmsEntry, CmsEntryValues, CmsModel } from "~/types";
import { STATUS_UNPUBLISHED } from "./statuses";
import type { SecurityIdentity } from "@webiny/api-security/types";
import { getIdentity } from "~/utils/identity";
import { getDate } from "~/utils/date";
import { createState } from "~/crud/contentEntry/entryDataFactories/state.js";

type CreateRepublishEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
};

export const createUnpublishEntryData = async <T extends CmsEntryValues = CmsEntryValues>({
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateRepublishEntryDataParams): Promise<{
    entry: CmsEntry<T>;
}> => {
    const currentDateTime = new Date().toISOString();
    const currentIdentity = getSecurityIdentity();

    const entry: CmsEntry<T> = {
        ...originalEntry,
        status: STATUS_UNPUBLISHED,
        state: createState(undefined),

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
        revisionModifiedBy: getIdentity(currentIdentity)
    } as CmsEntry<T>;

    return { entry };
};
