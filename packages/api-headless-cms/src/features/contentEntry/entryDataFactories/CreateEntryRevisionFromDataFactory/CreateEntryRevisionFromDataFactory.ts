import { createImplementation, Result } from "@webiny/feature/api";
import {
    CreateEntryRevisionFromDataFactory as FactoryAbstraction,
    type ICreateEntryRevisionFromDataFactory
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import { mapAndCleanUpdatedInputData } from "../mapAndCleanUpdatedInputData.js";
import { validateModelEntryData } from "~/crud/contentEntry/entryDataValidation.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "../statuses.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { getSystem } from "../system.js";
import { ModelToAstConverter } from "~/features/contentModel/ModelToAstConverter/abstractions.js";
import { ensureItemIds } from "../../ensureItemIds.js";
import { hasEntryContentChanged } from "../hasEntryContentChanged.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";

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

class CreateEntryRevisionFromDataFactoryImpl implements ICreateEntryRevisionFromDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly accessControl: AccessControl.Interface,
        private readonly modelToAstConverter: ModelToAstConverter.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        sourceId: string,
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<FactoryAbstraction.Return<TValues>> {
        const latestResult = await this.getLatestRevision.execute<TValues>(model, {
            id: originalEntry.entryId
        });
        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }
        const latestStorageEntry = latestResult.value;

        const initialValues = {
            ...originalEntry.values,
            ...mapAndCleanUpdatedInputData<TValues>(model, rawInput.values)
        };

        const modelAst = this.modelToAstConverter.toAst(model);
        await ensureItemIds(modelAst, initialValues);

        const invalidFields = await validateModelEntryData({
            context: this.cmsContext,
            model,
            values: initialValues,
            entry: originalEntry,
            skipValidation: options?.skipValidation
        });
        if (invalidFields.length > 0) {
            return Result.fail(new EntryValidationError("Validation failed.", invalidFields));
        }

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: initialValues,
            validateEntries: false
        });

        const latestId = latestStorageEntry ? latestStorageEntry.id : sourceId;
        const { id, version: nextVersion } = increaseEntryIdVersion(latestId);

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const status = rawInput.status || STATUS_DRAFT;
        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({ model, pw: "p" });
                if (!canPublish) {
                    return Result.fail(
                        new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`)
                    );
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({ model, pw: "u" });
                if (!canUnpublish) {
                    return Result.fail(
                        new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`)
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
            revisionFirstPublishedOn: getDate(rawInput.revisionFirstPublishedOn, null),
            revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, null),
            revisionFirstPublishedBy: getIdentity(rawInput.revisionFirstPublishedBy, null),
            revisionLastPublishedBy: getIdentity(rawInput.revisionLastPublishedBy, null)
        };

        let entryLevelPublishingMetaFields: Pick<
            CmsEntry,
            "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
        > = {
            firstPublishedOn: getDate(
                rawInput.firstPublishedOn,
                latestStorageEntry.firstPublishedOn
            ),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, latestStorageEntry.lastPublishedOn),
            firstPublishedBy: getIdentity(
                rawInput.firstPublishedBy,
                latestStorageEntry.firstPublishedBy
            ),
            lastPublishedBy: getIdentity(
                rawInput.lastPublishedBy,
                latestStorageEntry.lastPublishedBy
            )
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

        /**
         * Creating a revision without changing the entry's content (e.g. "New revision" in the
         * revisions list, or saving a published entry without editing anything) is not a
         * modification, so the entry-level saved/modified meta fields are kept. The new revision
         * is compared with the latest revision, not the source revision: creating a revision from
         * an older one reverts the content, which is a change. Explicitly provided meta field
         * values always take precedence.
         */
        const contentChanged = hasEntryContentChanged({
            values,
            baselineValues: latestStorageEntry.values
        });

        const entryLevelSaved = contentChanged
            ? {
                  savedOn: currentDateTime,
                  modifiedOn: currentDateTime,
                  savedBy: currentIdentity,
                  modifiedBy: currentIdentity
              }
            : {
                  savedOn: latestStorageEntry.savedOn,
                  modifiedOn: latestStorageEntry.modifiedOn,
                  savedBy: latestStorageEntry.savedBy,
                  modifiedBy: latestStorageEntry.modifiedBy
              };

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            id,
            version: nextVersion,
            createdOn: getDate(rawInput.createdOn, latestStorageEntry.createdOn),
            savedOn: getDate(rawInput.savedOn, entryLevelSaved.savedOn),
            modifiedOn: getDate(rawInput.modifiedOn, entryLevelSaved.modifiedOn),
            createdBy: getIdentity(rawInput.createdBy, latestStorageEntry.createdBy)!,
            savedBy: getIdentity(rawInput.savedBy, entryLevelSaved.savedBy)!,
            modifiedBy: getIdentity(rawInput.modifiedBy, entryLevelSaved.modifiedBy),
            ...entryLevelPublishingMetaFields,
            revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
            revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
            revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
            revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity)!,
            revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
            revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
            revisionDescription: undefined,
            ...revisionLevelPublishingMetaFields,
            locked,
            status,
            values,
            system: getSystem({
                input: rawInput,
                original: originalEntry
            }),
            live: originalEntry.live,
            expiresAt: null
        };

        return Result.ok({
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        });
    }
}

export const CreateEntryRevisionFromDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryRevisionFromDataFactoryImpl,
    dependencies: [
        CmsContext,
        IdentityContext,
        AccessControl,
        ModelToAstConverter,
        GetLatestRevisionByEntryIdUseCase
    ]
});
