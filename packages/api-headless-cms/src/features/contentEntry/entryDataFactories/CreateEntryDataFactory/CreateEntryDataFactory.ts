import { createImplementation } from "@webiny/feature/api";
import {
    CreateEntryDataFactory as FactoryAbstraction,
    type ICreateEntryDataFactory,
    type ICreateEntryDataResponse
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
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
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { getSystem } from "../system.js";
import { getExpiresAt } from "../expiresAt.js";

type DefaultValue = boolean | number | string | null;

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
    const { settings, list } = field;
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
    if (!list) {
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

const cleanInputValues = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input: TValues
) => {
    return model.fields.reduce<TValues>((acc, field) => {
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const key = field.fieldId as keyof TValues;
        const value = input[key] as TValues[keyof TValues];
        acc[key] = value === undefined ? (getDefaultValue(field) as TValues[keyof TValues]) : value;
        return acc;
    }, {} as TValues);
};

const createEntryId = (input: CreateCmsEntryInput) => {
    let entryId = mdbid();
    if (input.id) {
        if (input.id.match(/^([a-zA-Z0-9])([a-zA-Z0-9-]+)([a-zA-Z0-9])$/) === null) {
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

class CreateEntryDataFactoryImpl implements ICreateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryDataResponse<TValues>> {
        const initialValues = cleanInputValues<TValues>(model, rawInput.values || ({} as TValues));

        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: initialValues,
            skipValidators: options?.skipValidators
        });

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: initialValues,
            validateEntries: true
        });

        const { id, entryId, version } = createEntryId(rawInput);

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const status = rawInput.status || STATUS_DRAFT;
        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({ model, pw: "p" });
                if (!canPublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({ model, pw: "u" });
                if (!canUnpublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
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
                revisionFirstPublishedOn: getDate(
                    rawInput.revisionFirstPublishedOn,
                    currentDateTime
                ),
                revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, currentDateTime),
                revisionFirstPublishedBy: getIdentity(
                    rawInput.revisionFirstPublishedBy,
                    currentIdentity
                ),
                revisionLastPublishedBy: getIdentity(
                    rawInput.revisionLastPublishedBy,
                    currentIdentity
                )
            };

            entryLevelPublishingMetaFields = {
                firstPublishedOn: getDate(rawInput.firstPublishedOn, currentDateTime),
                lastPublishedOn: getDate(rawInput.lastPublishedOn, currentDateTime),
                firstPublishedBy: getIdentity(rawInput.firstPublishedBy, currentIdentity),
                lastPublishedBy: getIdentity(rawInput.lastPublishedBy, currentIdentity)
            };
        }

        const entry: CmsEntry<TValues> = {
            tenant: this.tenantContext.getTenant().id,
            entryId,
            id,
            modelId: model.modelId,
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
            system: getSystem({
                input: rawInput
            }),
            live:
                status === STATUS_PUBLISHED
                    ? {
                          version
                      }
                    : null,
            revisionDescription: "",
            expiresAt: getExpiresAt({ expiresAt: rawInput.expiresAt })
        };

        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({
                    model,
                    entry,
                    pw: "p"
                });
                if (!canPublish) {
                    throw new NotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({
                    model,
                    entry,
                    pw: "u"
                });
                if (!canUnpublish) {
                    throw new NotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
                }
            }
        }

        return {
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        };
    }
}

export const CreateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
