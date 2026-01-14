import type {
    CmsContext,
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsModelField,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { ROOT_FOLDER } from "~/constants.js";
import WebinyError from "@webiny/error";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { createIdentifier, mdbid } from "@webiny/utils";
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "./statuses.js";
import { getIdentity } from "~/utils/identity.js";
import type { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import { getState } from "./state.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

type DefaultValue = boolean | number | string | null;

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

/**
 * Cleans and adds default values to create input data.
 */
const mapAndCleanCreateInputData = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input: TValues
) => {
    return model.fields.reduce<TValues>((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const key = field.fieldId as keyof TValues;
        const value = input[key] as TValues[keyof TValues];
        /**
         * We set the default value on create input if value is not defined.
         */
        acc[key] = value === undefined ? (getDefaultValue(field) as TValues[keyof TValues]) : value;
        return acc;
    }, {} as TValues);
};

interface CreateEntryDataParams<TValues extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    rawInput: CreateCmsEntryInput<TValues>;
    options?: CreateCmsEntryOptionsInput;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    accessControl: AccessControl;
}

interface ICreateEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
    input: TValues;
}

export const createEntryData = async <TValues extends CmsEntryValues = CmsEntryValues>({
    model,
    rawInput,
    options,
    context,
    getIdentity: getSecurityIdentity,
    getTenant,
    accessControl
}: CreateEntryDataParams<TValues>): Promise<ICreateEntryDataResponse> => {
    const initialValues = mapAndCleanCreateInputData<TValues>(model, rawInput.values);

    await validateModelEntryDataOrThrow({
        context,
        model,
        values: initialValues,
        skipValidators: options?.skipValidators
    });

    const values = await referenceFieldsMapping<TValues>({
        context,
        model,
        values: initialValues,
        validateEntries: true
    });

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
        tenant: getTenant().id,
        entryId,
        id,
        modelId: model.modelId,

        /**
         * Entry-level meta fields. 👇
         */
        createdOn: getDate(rawInput.createdOn, currentDateTime),
        modifiedOn: getDate(rawInput.modifiedOn, null),
        savedOn: getDate(rawInput.savedOn, currentDateTime),
        deletedOn: getDate(rawInput.deletedOn, null),
        restoredOn: getDate(rawInput.restoredOn, null),
        createdBy: getIdentity(rawInput.createdBy, currentIdentity)!,
        modifiedBy: getIdentity(rawInput.modifiedBy, null),
        savedBy: getIdentity(rawInput.savedBy, currentIdentity)!,
        deletedBy: getIdentity(rawInput.deletedBy, null),
        restoredBy: getIdentity(rawInput.restoredBy, null),
        ...entryLevelPublishingMetaFields,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
        revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
        revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
        revisionDeletedOn: getDate(rawInput.revisionDeletedOn, null),
        revisionRestoredOn: getDate(rawInput.revisionRestoredOn, null),
        revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity)!,
        revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
        revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
        revisionDeletedBy: getIdentity(rawInput.revisionDeletedBy, null),
        revisionRestoredBy: getIdentity(rawInput.revisionRestoredBy, null),
        ...revisionLevelPublishingMetaFields,

        version,
        status,
        locked,
        values,
        location: {
            folderId:
                rawInput.location?.folderId || rawInput.wbyAco_location?.folderId || ROOT_FOLDER
        },
        state: getState({
            input: rawInput
        })
    };

    if (status !== STATUS_DRAFT) {
        if (status === STATUS_PUBLISHED) {
            await accessControl.ensureCanAccessEntry({ model, entry, pw: "p" });
        } else if (status === STATUS_UNPUBLISHED) {
            // If setting the status other than draft, we have to check if the user has permissions to publish.
            await accessControl.ensureCanAccessEntry({ model, entry, pw: "u" });
        }
    }

    return {
        entry,
        input: structuredClone(values)
    };
};
