import { createImplementation, Result } from "@webiny/feature/api";
import {
    type IUpdateEntryDataFactory,
    UpdateEntryDataFactory as FactoryAbstraction
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
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
import { validateModelEntryData } from "~/crud/contentEntry/entryDataValidation.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { mapAndCleanUpdatedInputData } from "../mapAndCleanUpdatedInputData.js";
import { getSystem } from "../system.js";
import { canOverrideMetaFields } from "../canOverrideMetaFields.js";
import { getExpiresAt } from "../expiresAt.js";
import { ModelToAstConverter } from "~/features/contentModel/ModelToAstConverter/abstractions.js";
import { ensureItemIds } from "../../ensureItemIds.js";
import { hasEntryContentChanged } from "../hasEntryContentChanged.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";

const allowedEntryStatus: string[] = ["draft", "published", "unpublished"];

const transformEntryStatus = (status: CmsEntryStatus | string): CmsEntryStatus => {
    return allowedEntryStatus.includes(status) ? (status as CmsEntryStatus) : "draft";
};

class UpdateEntryDataFactoryImpl implements IUpdateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly modelToAstConverter: ModelToAstConverter.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<FactoryAbstraction.Return<TValues>> {
        const latestResult = await this.getLatestRevision.execute<TValues>(model, {
            id: originalEntry.entryId
        });
        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }
        const latestEntry = latestResult.value;

        const cleanedValues = mapAndCleanUpdatedInputData<TValues>(
            model,
            rawInput?.values || ({} as TValues)
        );

        const invalidFields = await validateModelEntryData({
            context: this.cmsContext,
            model,
            values: cleanedValues,
            entry: originalEntry,
            skipValidation: options?.skipValidation
        });
        if (invalidFields.length > 0) {
            return Result.fail(new EntryValidationError("Validation failed.", invalidFields));
        }

        const mergedValues: TValues = {
            ...originalEntry.values,
            ...cleanedValues
        };

        const modelAst = this.modelToAstConverter.toAst(model);
        await ensureItemIds(modelAst, mergedValues);

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: mergedValues,
            validateEntries: false
        });

        // Security: meta field overrides (createdBy, ...) are ignored for identities limited to
        // their own entries, otherwise they could take over (or hand over) an entry.
        const metaInput: Partial<UpdateCmsEntryInput<TValues>> = (await canOverrideMetaFields({
            identityContext: this.identityContext,
            accessControl: this.accessControl,
            model
        }))
            ? rawInput
            : {};

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        /**
         * Saving without changing the content (e.g. clicking "Save" without editing anything) is
         * not a modification, so the saved/modified meta fields are kept. Entry-level values are
         * then taken from the latest revision, because storage copies them onto the latest
         * revision when a non-latest revision is updated. Revision-level values are this
         * revision's own. Explicitly provided meta field values always take precedence.
         */
        const contentChanged = hasEntryContentChanged({
            values,
            baselineValues: originalEntry.values
        });

        const entryLevelSaved = contentChanged
            ? {
                  savedOn: currentDateTime,
                  modifiedOn: currentDateTime,
                  savedBy: currentIdentity,
                  modifiedBy: currentIdentity
              }
            : {
                  savedOn: latestEntry.savedOn,
                  modifiedOn: latestEntry.modifiedOn,
                  savedBy: latestEntry.savedBy,
                  modifiedBy: latestEntry.modifiedBy
              };

        const revisionLevelSaved = contentChanged
            ? {
                  revisionSavedOn: currentDateTime,
                  revisionModifiedOn: currentDateTime,
                  revisionSavedBy: currentIdentity,
                  revisionModifiedBy: currentIdentity
              }
            : {
                  revisionSavedOn: originalEntry.revisionSavedOn,
                  revisionModifiedOn: originalEntry.revisionModifiedOn,
                  revisionSavedBy: originalEntry.revisionSavedBy,
                  revisionModifiedBy: originalEntry.revisionModifiedBy
              };

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            revisionCreatedOn: getDate(
                metaInput.revisionCreatedOn,
                originalEntry.revisionCreatedOn
            ),
            revisionModifiedOn: getDate(
                metaInput.revisionModifiedOn,
                revisionLevelSaved.revisionModifiedOn
            ),
            revisionSavedOn: getDate(metaInput.revisionSavedOn, revisionLevelSaved.revisionSavedOn),
            revisionDeletedOn: getDate(
                metaInput.revisionDeletedOn,
                originalEntry.revisionDeletedOn
            ),
            revisionRestoredOn: getDate(
                metaInput.revisionRestoredOn,
                originalEntry.revisionRestoredOn
            ),
            revisionFirstPublishedOn: getDate(
                metaInput.revisionFirstPublishedOn,
                originalEntry.revisionFirstPublishedOn
            ),
            revisionLastPublishedOn: getDate(
                metaInput.revisionLastPublishedOn,
                originalEntry.revisionLastPublishedOn
            ),
            revisionCreatedBy: getIdentity(
                metaInput.revisionCreatedBy,
                originalEntry.revisionCreatedBy
            )!,
            revisionModifiedBy: getIdentity(
                metaInput.revisionModifiedBy,
                revisionLevelSaved.revisionModifiedBy
            ),
            revisionSavedBy: getIdentity(
                metaInput.revisionSavedBy,
                revisionLevelSaved.revisionSavedBy
            )!,
            revisionDeletedBy: getIdentity(
                metaInput.revisionDeletedBy,
                originalEntry.revisionDeletedBy
            ),
            revisionRestoredBy: getIdentity(
                metaInput.revisionRestoredBy,
                originalEntry.revisionRestoredBy
            ),
            revisionFirstPublishedBy: getIdentity(
                metaInput.revisionFirstPublishedBy,
                originalEntry.revisionFirstPublishedBy
            ),
            revisionLastPublishedBy: getIdentity(
                metaInput.revisionLastPublishedBy,
                originalEntry.revisionLastPublishedBy
            ),
            createdOn: getDate(metaInput.createdOn, latestEntry.createdOn),
            savedOn: getDate(metaInput.savedOn, entryLevelSaved.savedOn),
            modifiedOn: getDate(metaInput.modifiedOn, entryLevelSaved.modifiedOn),
            deletedOn: getDate(metaInput.deletedOn, latestEntry.deletedOn),
            restoredOn: getDate(metaInput.restoredOn, latestEntry.restoredOn),
            firstPublishedOn: getDate(metaInput.firstPublishedOn, latestEntry.firstPublishedOn),
            lastPublishedOn: getDate(metaInput.lastPublishedOn, latestEntry.lastPublishedOn),
            createdBy: getIdentity(metaInput.createdBy, latestEntry.createdBy)!,
            savedBy: getIdentity(metaInput.savedBy, entryLevelSaved.savedBy)!,
            modifiedBy: getIdentity(metaInput.modifiedBy, entryLevelSaved.modifiedBy),
            deletedBy: getIdentity(metaInput.deletedBy, latestEntry.deletedBy),
            restoredBy: getIdentity(metaInput.restoredBy, latestEntry.restoredBy),
            firstPublishedBy: getIdentity(metaInput.firstPublishedBy, latestEntry.firstPublishedBy),
            lastPublishedBy: getIdentity(metaInput.lastPublishedBy, latestEntry.lastPublishedBy),
            values,
            status: transformEntryStatus(originalEntry.status),
            system: getSystem({
                input: rawInput,
                original: originalEntry
            }),
            live: originalEntry.live,
            expiresAt: getExpiresAt({ expiresAt: rawInput.expiresAt }, originalEntry)
        };

        const folderId = rawInput.wbyAco_location?.folderId;
        if (folderId) {
            entry.location = {
                folderId
            };
        }

        return Result.ok({
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        });
    }
}

export const UpdateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: UpdateEntryDataFactoryImpl,
    dependencies: [
        CmsContext,
        IdentityContext,
        ModelToAstConverter,
        GetLatestRevisionByEntryIdUseCase,
        AccessControl
    ]
});
