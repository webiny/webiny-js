import { createImplementation } from "@webiny/feature/api";
import {
    CreateRepublishEntryDataFactory as FactoryAbstraction,
    type ICreateRepublishEntryDataFactory,
    type ICreateRepublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreateRepublishEntryDataFactoryImpl implements ICreateRepublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateRepublishEntryDataResponse<TValues>> {
        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            validateEntries: false
        });

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            savedOn: getDate(currentDateTime),
            modifiedOn: getDate(currentDateTime),
            savedBy: getIdentity(currentIdentity)!,
            modifiedBy: getIdentity(currentIdentity),
            firstPublishedOn: getDate(originalEntry.firstPublishedOn, currentDateTime),
            firstPublishedBy: getIdentity(originalEntry.firstPublishedBy, currentIdentity),
            lastPublishedOn: getDate(currentDateTime),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionSavedBy: getIdentity(currentIdentity)!,
            revisionModifiedBy: getIdentity(currentIdentity),
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

        return { entry };
    }
}

export const CreateRepublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateRepublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
