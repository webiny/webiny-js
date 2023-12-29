import {
    CmsContext,
    CmsEntry,
    CmsEntryStatus,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types";
import { getDate } from "~/utils/date";
import { getIdentity } from "~/utils/identity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { validateModelEntryDataOrThrow } from "../entryDataValidation";
import { referenceFieldsMapping } from "../referenceFieldsMapping";
import { mapAndCleanUpdatedInputData } from "./mapAndCleanUpdatedInputData";
import lodashMerge from "lodash/merge";
import { removeNullValues, removeUndefinedValues } from "@webiny/utils";

type CreateEntryRevisionFromDataParams = {
    metaInput?: Record<string, any>;
    model: CmsModel;
    rawInput: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    originalEntry: CmsEntry;
};

export const createUpdateEntryData = async ({
    model,
    rawInput,
    options,
    context,
    metaInput,
    getIdentity: getSecurityIdentity,
    originalEntry
}: CreateEntryRevisionFromDataParams): Promise<{
    entry: CmsEntry;
    input: Record<string, any>;
}> => {
    /**
     * Make sure we only work with fields that are defined in the model.
     */
    const input = mapAndCleanUpdatedInputData(model, rawInput);

    await validateModelEntryDataOrThrow({
        context,
        model,
        data: input,
        entry: originalEntry,
        skipValidators: options?.skipValidators
    });

    const initialValues = {
        /**
         * Existing values from the database, transformed back to original, of course.
         */
        ...originalEntry.values,
        /**
         * Add new values.
         */
        ...input
    };

    const values = await referenceFieldsMapping({
        context,
        model,
        input: initialValues,
        validateEntries: false
    });

    /**
     * If users wants to remove a key from meta values, they need to send meta key with the null value.
     */
    const meta = createEntryMeta(metaInput, originalEntry.meta);

    const currentIdentity = getSecurityIdentity();
    const currentDateTime = new Date();

    /**
     * We always send the full entry to the hooks and storage operations update.
     */
    const entry: CmsEntry = {
        ...originalEntry,

        /**
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */
        savedOn: getDate(rawInput.savedOn, new Date()),
        createdOn: getDate(rawInput.createdOn, originalEntry.createdOn),
        publishedOn: getDate(rawInput.publishedOn, originalEntry.publishedOn),
        createdBy: getIdentity(rawInput.createdBy, originalEntry.createdBy),
        modifiedBy: getIdentity(rawInput.modifiedBy, getSecurityIdentity()),
        ownedBy: getIdentity(rawInput.ownedBy, originalEntry.ownedBy),

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInput.revisionCreatedOn, originalEntry.revisionCreatedOn),
        revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInput.revisionModifiedOn, currentDateTime),
        revisionFirstPublishedOn: getDate(
            rawInput.revisionFirstPublishedOn,
            originalEntry.revisionFirstPublishedOn
        ),
        revisionLastPublishedOn: getDate(
            rawInput.revisionLastPublishedOn,
            originalEntry.revisionLastPublishedOn
        ),
        revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, originalEntry.revisionCreatedBy),
        revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        revisionModifiedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        revisionFirstPublishedBy: getIdentity(
            rawInput.revisionFirstPublishedBy,
            originalEntry.revisionFirstPublishedBy
        ),
        revisionLastPublishedBy: getIdentity(
            rawInput.revisionLastPublishedBy,
            originalEntry.revisionLastPublishedBy
        ),

        /**
         * Entry-level meta fields. 👇
         * If required, within storage operations, these entry-level updates
         * will be propagated to the latest revision too.
         */
        entryCreatedOn: getDate(rawInput.entryCreatedOn, originalEntry.entryCreatedOn),
        entrySavedOn: getDate(rawInput.entrySavedOn, currentDateTime),
        entryModifiedOn: getDate(rawInput.entryModifiedOn, currentDateTime),
        entryFirstPublishedOn: getDate(
            rawInput.entryFirstPublishedOn,
            originalEntry.entryFirstPublishedOn
        ),
        entryLastPublishedOn: getDate(
            rawInput.entryLastPublishedOn,
            originalEntry.entryLastPublishedOn
        ),
        entryCreatedBy: getIdentity(rawInput.entryCreatedBy, originalEntry.entryCreatedBy),
        entrySavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        entryModifiedBy: getIdentity(rawInput.entryModifiedBy, currentIdentity),
        entryFirstPublishedBy: getIdentity(
            rawInput.entryFirstPublishedBy,
            originalEntry.entryFirstPublishedBy
        ),
        entryLastPublishedBy: getIdentity(
            rawInput.entryLastPublishedBy,
            originalEntry.entryLastPublishedBy
        ),

        values,
        meta,
        status: transformEntryStatus(originalEntry.status)
    };

    const folderId = rawInput.wbyAco_location?.folderId;
    if (folderId) {
        entry.location = {
            folderId
        };
    }

    return { entry, input };
};

/**
 * This method takes original entry meta and new input.
 * When new meta is merged onto the existing one, everything that has undefined or null value is removed.
 */
const createEntryMeta = (input?: Record<string, any>, original?: Record<string, any>) => {
    const meta = lodashMerge(original || {}, input || {});
    return removeUndefinedValues(removeNullValues(meta));
};

const allowedEntryStatus: string[] = ["draft", "published", "unpublished"];

const transformEntryStatus = (status: CmsEntryStatus | string): CmsEntryStatus => {
    return allowedEntryStatus.includes(status) ? (status as CmsEntryStatus) : "draft";
};
