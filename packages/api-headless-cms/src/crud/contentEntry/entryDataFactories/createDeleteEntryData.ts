import { CmsContext, CmsEntry, CmsModel } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";
import { getIdentity } from "~/utils/identity";
import { getDate } from "~/utils/date";

type CreateDeleteEntryDataParams = {
    model: CmsModel;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    originalEntry: CmsEntry;
};

export const createDeleteEntryData = async ({
    model,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateDeleteEntryDataParams): Promise<{
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
        deleted: true,

        /**
         * Entry-level meta fields. 👇
         */
        deletedOn: getDate(currentDateTime, null),
        deletedBy: getIdentity(currentIdentity, null),

        /**
         * Revision-level meta fields. 👇
         */
        revisionDeletedOn: getDate(currentDateTime, null),
        revisionDeletedBy: getIdentity(currentIdentity, null)
    };

    return { entry };
};
