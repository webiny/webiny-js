import { createImplementation, Result } from "@webiny/feature/api";
import {
    CreateRepublishEntryDataFactory as FactoryAbstraction,
    type ICreateRepublishEntryDataFactory
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";

class CreateRepublishEntryDataFactoryImpl implements ICreateRepublishEntryDataFactory {
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

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            validateEntries: false
        });

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        /**
         * Republishing is not a content modification, so saved/modified meta fields are kept.
         * Entry-level values are taken from the latest revision, because storage copies them
         * onto the latest revision when a non-latest revision is republished. Revision-level
         * values are the republished revision's own, and come from `originalEntry`.
         */
        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            savedOn: getDate(latestEntry.savedOn, originalEntry.savedOn),
            modifiedOn: getDate(latestEntry.modifiedOn),
            savedBy: getIdentity(latestEntry.savedBy, originalEntry.savedBy),
            modifiedBy: getIdentity(latestEntry.modifiedBy),
            firstPublishedOn: getDate(originalEntry.firstPublishedOn, currentDateTime),
            firstPublishedBy: getIdentity(originalEntry.firstPublishedBy, currentIdentity),
            lastPublishedOn: getDate(currentDateTime),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionFirstPublishedOn: getDate(
                originalEntry.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionFirstPublishedBy: getIdentity(
                originalEntry.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedOn: getDate(currentDateTime),
            revisionLastPublishedBy: getIdentity(currentIdentity),
            values,
            live: {
                version: originalEntry.version
            }
        };

        return Result.ok({ entry });
    }
}

export const CreateRepublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateRepublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, GetLatestRevisionByEntryIdUseCase]
});
