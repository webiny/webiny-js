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
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "./statuses";
import { AccessControl } from "~/crud/AccessControl/AccessControl";

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
    accessControl: AccessControl;
};

export const createEntryRevisionFromData = async ({
    sourceId,
    model,
    rawInput,
    options,
    context,
    getIdentity: getSecurityIdentity,
    originalEntry,
    latestStorageEntry,
    accessControl
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

    /**
     * Users can set the initial status of the entry. If so, we need to make
     * sure they have the required permissions and also that all the fields
     * are filled in correctly.
     */
    const status = rawInput.status || STATUS_DRAFT;
    if (status !== STATUS_DRAFT) {
        if (status === STATUS_PUBLISHED) {
            await accessControl.ensureCanAccessEntry({ model, pw: "p" });
        } else if (status === STATUS_UNPUBLISHED) {
            // If setting the status other than draft, we have to check if the user has permissions to publish.
            await accessControl.ensureCanAccessEntry({ model, pw: "u" });
        }
    }

    const locked = status !== STATUS_DRAFT;

    let revisionLevelPublishingMetaFields: Pick<
        CmsEntry,
        | "revisionFirstPublishedOn"
        | "revisionLastPublishedOn"
        | "revisionFirstPublishedBy"
        | "revisionLastPublishedBy"
    > = {
        revisionFirstPublishedOn: getDate(rawInput.revisionFirstPublishedOn, null),
        revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, null),
        revisionFirstPublishedBy: getIdentity(rawInput.revisionFirstPublishedBy, null),
        revisionLastPublishedBy: getIdentity(rawInput.revisionLastPublishedBy, null)
    };

    let entryLevelPublishingMetaFields: Pick<
        CmsEntry,
        "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
    > = {
        firstPublishedOn: getDate(rawInput.firstPublishedOn, latestStorageEntry.firstPublishedOn),
        lastPublishedOn: getDate(rawInput.lastPublishedOn, latestStorageEntry.lastPublishedOn),
        firstPublishedBy: getIdentity(
            rawInput.firstPublishedBy,
            latestStorageEntry.firstPublishedBy
        ),
        lastPublishedBy: getIdentity(rawInput.lastPublishedBy, latestStorageEntry.lastPublishedBy)
    };

    if (status === STATUS_PUBLISHED) {
        revisionLevelPublishingMetaFields = {
            revisionFirstPublishedOn: getDate(rawInput.revisionFirstPublishedOn, currentDateTime),
            revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, currentDateTime),
            revisionFirstPublishedBy: getIdentity(
                rawInput.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedBy: getIdentity(rawInput.revisionLastPublishedBy, currentIdentity)
        };

        entryLevelPublishingMetaFields = {
            firstPublishedOn: getDate(
                rawInput.firstPublishedOn,
                latestStorageEntry.firstPublishedOn
            ),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, currentDateTime),
            firstPublishedBy: getIdentity(
                rawInput.firstPublishedBy,
                latestStorageEntry.firstPublishedBy
            ),
            lastPublishedBy: getIdentity(rawInput.lastPublishedBy, currentIdentity)
        };
    }

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
        createdBy: getIdentity(rawInput.createdBy, latestStorageEntry.createdBy),
        savedBy: getIdentity(rawInput.savedBy, currentIdentity),
        modifiedBy: getIdentity(rawInput.modifiedBy, currentIdentity),
        ...entryLevelPublishingMetaFields,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
        revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
        revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity),
        revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
        ...revisionLevelPublishingMetaFields,

        locked,
        status,
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
