import {
    CmsContext,
    CmsEntry,
    CmsModel,
    CmsModelField,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types";
import { getDate } from "~/utils/date";
import { ROOT_FOLDER } from "~/constants";
import WebinyError from "@webiny/error";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping";
import { createIdentifier, mdbid } from "@webiny/utils";
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "./statuses";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { EntriesPermissions } from "~/utils/permissions/EntriesPermissions";
import { getIdentity } from "~/utils/identity";

type DefaultValue = boolean | number | string | null;

type CreateEntryDataParams = {
    model: CmsModel;
    rawInput: CreateCmsEntryInput;
    options?: CreateCmsEntryOptionsInput;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    entriesPermissions: EntriesPermissions;
};

export const createEntryData = async ({
    model,
    rawInput,
    options,
    context,
    getIdentity: getSecurityIdentity,
    getLocale,
    getTenant,
    entriesPermissions
}: CreateEntryDataParams): Promise<{
    entry: CmsEntry;
    input: Record<string, any>;
}> => {
    const initialInput = mapAndCleanCreateInputData(model, rawInput);

    await validateModelEntryDataOrThrow({
        context,
        model,
        data: initialInput,
        skipValidators: options?.skipValidators
    });

    const input = await referenceFieldsMapping({
        context,
        model,
        input: initialInput,
        validateEntries: true
    });

    const locale = getLocale();

    const { id, entryId, version } = createEntryId(rawInput);

    /**
     * There is a possibility that user sends an ID in the input, so we will use that one.
     * There is no check if the ID is unique or not, that is up to the user.
     */
    const currentIdentity = getSecurityIdentity();
    const currentDateTime = new Date();

    /**
     * Users can set the initial status of the entry. If so, we need to make
     * sure they have the required permissions and also that all the fields
     * are filled in correctly.
     */

    const rawInputMeta = rawInput.meta || {};
    const status = rawInputMeta.status || STATUS_DRAFT;
    if (status !== STATUS_DRAFT) {
        // If setting the status other than draft, we have to check
        // if the user has permissions to publish/unpublish.
        if (status === STATUS_PUBLISHED) {
            await entriesPermissions.ensure({ pw: "p" });
        } else if (status === STATUS_UNPUBLISHED) {
            await entriesPermissions.ensure({ pw: "u" });
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
        revisionFirstPublishedOn: null,
        revisionLastPublishedOn: null,
        revisionFirstPublishedBy: null,
        revisionLastPublishedBy: null
    };

    let entryLevelPublishingMetaFields: Pick<
        CmsEntry,
        | "entryFirstPublishedOn"
        | "entryLastPublishedOn"
        | "entryFirstPublishedBy"
        | "entryLastPublishedBy"
    > = {
        entryFirstPublishedOn: null,
        entryLastPublishedOn: null,
        entryFirstPublishedBy: null,
        entryLastPublishedBy: null
    };

    if (status === STATUS_PUBLISHED) {
        revisionLevelPublishingMetaFields = {
            revisionFirstPublishedOn: getDate(
                rawInputMeta.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionLastPublishedOn: getDate(
                rawInputMeta.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionFirstPublishedBy: getIdentity(
                rawInputMeta.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedBy: getIdentity(
                rawInputMeta.revisionLastPublishedBy,
                currentIdentity
            )
        };

        entryLevelPublishingMetaFields = {
            entryFirstPublishedOn: getDate(rawInputMeta.entryFirstPublishedOn, currentDateTime),
            entryLastPublishedOn: getDate(rawInputMeta.entryFirstPublishedOn, currentDateTime),
            entryFirstPublishedBy: getIdentity(rawInputMeta.entryFirstPublishedBy, currentIdentity),
            entryLastPublishedBy: getIdentity(rawInputMeta.entryLastPublishedBy, currentIdentity)
        };
    }

    const entry: CmsEntry = {
        webinyVersion: context.WEBINY_VERSION,
        tenant: getTenant().id,
        entryId,
        id,
        modelId: model.modelId,
        locale: locale.code,

        /**
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */
        createdOn: getDate(rawInput.createdOn, currentDateTime),
        savedOn: getDate(rawInput.savedOn, currentDateTime),
        publishedOn: getDate(rawInput.publishedOn),
        createdBy: getIdentity(rawInput.createdBy, currentIdentity),
        ownedBy: getIdentity(rawInput.ownedBy, currentIdentity),
        modifiedBy: getIdentity(rawInput.modifiedBy, null),

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInputMeta.revisionCreatedOn, currentDateTime),
        revisionSavedOn: getDate(rawInputMeta.revisionSavedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInputMeta.revisionModifiedOn, null),
        revisionCreatedBy: getIdentity(rawInputMeta.revisionCreatedBy, currentIdentity),
        revisionSavedBy: getIdentity(rawInputMeta.revisionSavedBy, currentIdentity),
        revisionModifiedBy: getIdentity(rawInputMeta.revisionModifiedBy, null),
        ...revisionLevelPublishingMetaFields,

        /**
         * Entry-level meta fields. 👇
         */
        entryCreatedOn: getDate(rawInputMeta.entryCreatedOn, currentDateTime),
        entrySavedOn: getDate(rawInputMeta.entrySavedOn, currentDateTime),
        entryModifiedOn: getDate(rawInputMeta.entryModifiedOn, null),
        entryCreatedBy: getIdentity(rawInputMeta.entryCreatedBy, currentIdentity),
        entrySavedBy: getIdentity(rawInputMeta.entrySavedBy, currentIdentity),
        entryModifiedBy: getIdentity(rawInputMeta.entryModifiedBy, null),
        ...entryLevelPublishingMetaFields,

        version,
        status,
        locked,
        values: input,
        location: {
            folderId: rawInput.wbyAco_location?.folderId || ROOT_FOLDER
        }
    };

    return { entry, input };
};

/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsModelField, value: DefaultValue): DefaultValue => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};

const getDefaultValue = (field: CmsModelField): (DefaultValue | DefaultValue[]) | undefined => {
    const { settings, multipleValues } = field;
    if (settings && settings.defaultValue !== undefined) {
        return convertDefaultValue(field, settings.defaultValue);
    }
    const { predefinedValues } = field;
    if (
        !predefinedValues ||
        !predefinedValues.enabled ||
        Array.isArray(predefinedValues.values) === false
    ) {
        return undefined;
    }
    if (!multipleValues) {
        const selectedValue = predefinedValues.values.find(value => {
            return !!value.selected;
        });
        if (selectedValue) {
            return convertDefaultValue(field, selectedValue.value);
        }
        return undefined;
    }
    return predefinedValues.values
        .filter(({ selected }) => !!selected)
        .map(({ value }) => {
            return convertDefaultValue(field, value);
        });
};

/**
 * Cleans and adds default values to create input data.
 */
const mapAndCleanCreateInputData = (model: CmsModel, input: CreateCmsEntryInput) => {
    return model.fields.reduce<CreateCmsEntryInput>((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const value = input[field.fieldId];
        /**
         * We set the default value on create input if value is not defined.
         */
        acc[field.fieldId] = value === undefined ? getDefaultValue(field) : value;
        return acc;
    }, {});
};

const createEntryId = (input: CreateCmsEntryInput) => {
    let entryId = mdbid();
    if (input.id) {
        if (input.id.match(/^([a-zA-Z0-9])([a-zA-Z0-9\-]+)([a-zA-Z0-9])$/) === null) {
            throw new WebinyError(
                "The provided ID is not valid. It must be a string which can be A-Z, a-z, 0-9, - and it cannot start or end with a -.",
                "INVALID_ID",
                {
                    id: input.id
                }
            );
        }
        entryId = input.id;
    }
    const version = 1;
    return {
        entryId,
        version,
        id: createIdentifier({
            id: entryId,
            version
        })
    };
};
