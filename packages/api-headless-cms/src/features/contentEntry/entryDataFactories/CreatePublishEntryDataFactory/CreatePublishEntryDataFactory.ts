import { createImplementation, Result } from "@webiny/feature/api";
import {
    CreatePublishEntryDataFactory as FactoryAbstraction,
    type ICreatePublishEntryDataFactory
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { validateModelEntryData } from "~/crud/contentEntry/entryDataValidation.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";

class CreatePublishEntryDataFactoryImpl implements ICreatePublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<FactoryAbstraction.Return<TValues>> {
        const latestResult = await this.getLatestRevision.execute<TValues>(model, {
            id: originalEntry.entryId
        });
        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }
        const latestEntry = latestResult.value;

        const invalidFields = await validateModelEntryData({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            entry: originalEntry
        });
        if (invalidFields.length > 0) {
            return Result.fail(new EntryValidationError("Validation failed.", invalidFields));
        }

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        /**
         * Publishing is not a content modification, so saved/modified meta fields are kept.
         * Entry-level values are taken from the latest revision, because storage copies them
         * onto the latest revision when a non-latest revision is published. Revision-level
         * values are the published revision's own, and come from `originalEntry`.
         */
        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            locked: true,
            createdOn: getDate(latestEntry.createdOn),
            modifiedOn: getDate(latestEntry.modifiedOn),
            savedOn: getDate(latestEntry.savedOn, originalEntry.savedOn),
            firstPublishedOn: getDate(latestEntry.firstPublishedOn, currentDateTime),
            lastPublishedOn: getDate(currentDateTime),
            createdBy: getIdentity(latestEntry.createdBy),
            modifiedBy: getIdentity(latestEntry.modifiedBy),
            savedBy: getIdentity(latestEntry.savedBy, originalEntry.savedBy),
            firstPublishedBy: getIdentity(latestEntry.firstPublishedBy, currentIdentity),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionCreatedOn: getDate(originalEntry.revisionCreatedOn),
            revisionFirstPublishedOn: getDate(
                originalEntry.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionLastPublishedOn: getDate(currentDateTime),
            revisionCreatedBy: getIdentity(originalEntry.revisionCreatedBy),
            revisionFirstPublishedBy: getIdentity(
                originalEntry.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedBy: getIdentity(currentIdentity),
            live: {
                version: originalEntry.version
            }
        };

        return Result.ok({ entry });
    }
}

export const CreatePublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreatePublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, GetLatestRevisionByEntryIdUseCase]
});
