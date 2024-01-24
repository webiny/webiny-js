import {
    CmsContext,
    CmsEntry,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types";
import { getDate } from "~/utils/date";
import { getIdentity } from "~/utils/identity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { mapAndCleanUpdatedInputData } from ".//mapAndCleanUpdatedInputData";
import { validateModelEntryDataOrThrow } from "../entryDataValidation";
import { referenceFieldsMapping } from "../referenceFieldsMapping";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { STATUS_DRAFT } from "./statuses";

type CreateEntryRevisionFromDataParams = {
    sourceId: string;
    model: CmsModel;
    rawInput: CreateCmsEntryInput;
    options?: CreateCmsEntryOptionsInput;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    originalEntry: CmsEntry;
    latestStorageEntry: CmsEntry;
};

export const createEntryRevisionFromData = async ({
    sourceId,
    model,
    rawInput,
    options,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry,
    latestStorageEntry
}: CreateEntryRevisionFromDataParams): Promise<{
    entry: CmsEntry;
    input: Record<string, any>;
}> => {
    /**
     * Make sure we only work with fields that are defined in the model.
     */
    const input = mapAndCleanUpdatedInputData(model, rawInput);

    const initialValues = {
        ...originalEntry.values,
        ...input
    };

    await validateModelEntryDataOrThrow({
        context,
        model,
        data: initialValues,
        entry: originalEntry,
        skipValidators: options?.skipValidators
    });

    const values = await referenceFieldsMapping({
        context,
        model,
        input: initialValues,
        validateEntries: false
    });

    const latestId = latestStorageEntry ? latestStorageEntry.id : sourceId;
    const { id, version: nextVersion } = increaseEntryIdVersion(latestId);

    const currentIdentity = getSecurityIdentity();
    const currentDateTime = new Date();

    const entry: CmsEntry = {
        ...originalEntry,
        id,
        version: nextVersion,

        /**
         * Entry-level meta fields. 👇
         */
        createdOn: getDate(rawInput.createdOn, latestStorageEntry.createdOn),
        savedOn: getDate(rawInput.savedOn, currentDateTime),
        modifiedOn: getDate(rawInput.modifiedOn, currentDateTime),
        firstPublishedOn: getDate(rawInput.firstPublishedOn, latestStorageEntry.firstPublishedOn),
        lastPublishedOn: getDate(rawInput.lastPublishedOn, latestStorageEntry.lastPublishedOn),
        createdBy: getIdentity(rawInput.createdBy, latestStorageEntry.createdBy),
        savedBy: getIdentity(rawInput.savedBy, currentIdentity),
        modifiedBy: getIdentity(rawInput.modifiedBy, currentIdentity),
        firstPublishedBy: getIdentity(
            rawInput.firstPublishedBy,
            latestStorageEntry.firstPublishedBy
        ),
        lastPublishedBy: getIdentity(rawInput.lastPublishedBy, latestStorageEntry.lastPublishedBy),

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
        revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
        revisionFirstPublishedOn: getDate(rawInput.revisionFirstPublishedOn, null),
        revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, null),
        revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity),
        revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
        revisionFirstPublishedBy: getIdentity(rawInput.revisionFirstPublishedBy, null),
        revisionLastPublishedBy: getIdentity(rawInput.revisionLastPublishedBy, null),

        locked: false,
        status: STATUS_DRAFT,
        values
    };

    return { entry, input };
};

const increaseEntryIdVersion = (id: string) => {
    const { id: entryId, version } = parseIdentifier(id);
    if (!version) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    return {
        entryId,
        version: version + 1,
        id: createIdentifier({
            id: entryId,
            version: version + 1
        })
    };
};
