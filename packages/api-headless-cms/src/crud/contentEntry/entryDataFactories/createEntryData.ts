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
    const status = rawInput.status || STATUS_DRAFT;
    if (status !== STATUS_DRAFT) {
        if (status === STATUS_PUBLISHED) {
            await entriesPermissions.ensureCanAccess({ model, pw: "p" });
        } else if (status === STATUS_UNPUBLISHED) {
            // If setting the status other than draft, we have to check if the user has permissions to publish.
            await entriesPermissions.ensureCanAccess({ model, pw: "u" });
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
        "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
    > = {
        firstPublishedOn: null,
        lastPublishedOn: null,
        firstPublishedBy: null,
        lastPublishedBy: null
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
            firstPublishedOn: getDate(rawInput.firstPublishedOn, currentDateTime),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, currentDateTime),
            firstPublishedBy: getIdentity(rawInput.firstPublishedBy, currentIdentity),
            lastPublishedBy: getIdentity(rawInput.lastPublishedBy, currentIdentity)
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
         * Entry-level meta fields. 👇
         */
        createdOn: getDate(rawInput.createdOn, currentDateTime),
        modifiedOn: getDate(rawInput.modifiedOn, null),
        savedOn: getDate(rawInput.savedOn, currentDateTime),
        createdBy: getIdentity(rawInput.createdBy, currentIdentity),
        modifiedBy: getIdentity(rawInput.modifiedBy, null),
        savedBy: getIdentity(rawInput.savedBy, currentIdentity),
        ...entryLevelPublishingMetaFields,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
        revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
        revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity),
        revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
        revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity),
        ...revisionLevelPublishingMetaFields,

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
