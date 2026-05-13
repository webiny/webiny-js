import { createImplementation } from "@webiny/feature/api";
import {
    CreatePublishEntryDataFactory as FactoryAbstraction,
    type ICreatePublishEntryDataFactory,
    type ICreatePublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreatePublishEntryDataFactoryImpl implements ICreatePublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>,
        latestEntry: CmsEntry<TValues>
    ): Promise<ICreatePublishEntryDataResponse<TValues>> {
        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            entry: originalEntry
        });

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            locked: true,
            createdOn: getDate(latestEntry.createdOn),
            modifiedOn: getDate(currentDateTime),
            savedOn: getDate(currentDateTime),
            firstPublishedOn: getDate(latestEntry.firstPublishedOn, currentDateTime),
            lastPublishedOn: getDate(currentDateTime),
            createdBy: getIdentity(latestEntry.createdBy),
            modifiedBy: getIdentity(currentIdentity),
            savedBy: getIdentity(currentIdentity),
            firstPublishedBy: getIdentity(latestEntry.firstPublishedBy, currentIdentity),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionCreatedOn: getDate(originalEntry.revisionCreatedOn),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionFirstPublishedOn: getDate(
                originalEntry.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionLastPublishedOn: getDate(currentDateTime),
            revisionCreatedBy: getIdentity(originalEntry.revisionCreatedBy),
            revisionSavedBy: getIdentity(currentIdentity),
            revisionModifiedBy: getIdentity(currentIdentity),
            revisionFirstPublishedBy: getIdentity(
                originalEntry.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedBy: getIdentity(currentIdentity),
            live: {
                version: originalEntry.version
            }
        };

        return { entry };
    }
}

export const CreatePublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreatePublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
