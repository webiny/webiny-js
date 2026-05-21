import { createImplementation } from "@webiny/feature/api";
import {
    type IUpdateEntryDataFactory,
    type IUpdateEntryDataResponse,
    UpdateEntryDataFactory as FactoryAbstraction
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryStatus,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { mapAndCleanUpdatedInputData } from "../mapAndCleanUpdatedInputData.js";
import { getSystem } from "../system.js";

const allowedEntryStatus: string[] = ["draft", "published", "unpublished"];

const transformEntryStatus = (status: CmsEntryStatus | string): CmsEntryStatus => {
    return allowedEntryStatus.includes(status) ? (status as CmsEntryStatus) : "draft";
};

class UpdateEntryDataFactoryImpl implements IUpdateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<IUpdateEntryDataResponse<TValues>> {
        const cleanedValues = mapAndCleanUpdatedInputData<TValues>(
            model,
            rawInput?.values || ({} as TValues)
        );

        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: cleanedValues,
            entry: originalEntry,
            skipValidators: options?.skipValidators
        });

        const mergedValues: TValues = {
            ...originalEntry.values,
            ...cleanedValues
        };

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: mergedValues,
            validateEntries: false
        });

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const expiresAt = rawInput.expiresAt
            ? rawInput.expiresAt.getTime() / 1000
            : originalEntry.expiresAt;

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            revisionCreatedOn: getDate(rawInput.revisionCreatedOn, originalEntry.revisionCreatedOn),
            revisionModifiedOn: getDate(rawInput.revisionModifiedOn, currentDateTime),
            revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
            revisionDeletedOn: getDate(rawInput.revisionDeletedOn, null),
            revisionRestoredOn: getDate(rawInput.revisionRestoredOn, null),
            revisionFirstPublishedOn: getDate(
                rawInput.revisionFirstPublishedOn,
                originalEntry.revisionFirstPublishedOn
            ),
            revisionLastPublishedOn: getDate(
                rawInput.revisionLastPublishedOn,
                originalEntry.revisionLastPublishedOn
            ),
            revisionCreatedBy: getIdentity(
                rawInput.revisionCreatedBy,
                originalEntry.revisionCreatedBy
            )!,
            revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, currentIdentity),
            revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
            revisionDeletedBy: getIdentity(rawInput.revisionSavedBy, null),
            revisionRestoredBy: getIdentity(rawInput.revisionRestoredBy, null),
            revisionFirstPublishedBy: getIdentity(
                rawInput.revisionFirstPublishedBy,
                originalEntry.revisionFirstPublishedBy
            ),
            revisionLastPublishedBy: getIdentity(
                rawInput.revisionLastPublishedBy,
                originalEntry.revisionLastPublishedBy
            ),
            createdOn: getDate(rawInput.createdOn, originalEntry.createdOn),
            savedOn: getDate(rawInput.savedOn, currentDateTime),
            modifiedOn: getDate(rawInput.modifiedOn, currentDateTime),
            deletedOn: getDate(rawInput.deletedOn, null),
            restoredOn: getDate(rawInput.restoredOn, null),
            firstPublishedOn: getDate(rawInput.firstPublishedOn, originalEntry.firstPublishedOn),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, originalEntry.lastPublishedOn),
            createdBy: getIdentity(rawInput.createdBy, originalEntry.createdBy)!,
            savedBy: getIdentity(rawInput.savedBy, currentIdentity)!,
            modifiedBy: getIdentity(rawInput.modifiedBy, currentIdentity),
            deletedBy: getIdentity(rawInput.deletedBy, null),
            restoredBy: getIdentity(rawInput.restoredBy, null),
            firstPublishedBy: getIdentity(
                rawInput.firstPublishedBy,
                originalEntry.firstPublishedBy
            ),
            lastPublishedBy: getIdentity(rawInput.lastPublishedBy, originalEntry.lastPublishedBy),
            values,
            status: transformEntryStatus(originalEntry.status),
            system: getSystem({
                input: rawInput,
                original: originalEntry
            }),
            live: originalEntry.live,
            expiresAt
        };

        const folderId = rawInput.wbyAco_location?.folderId;
        if (folderId) {
            entry.location = {
                folderId
            };
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

export const UpdateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: UpdateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
