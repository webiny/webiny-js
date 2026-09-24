import { createImplementation, Result } from "@webiny/feature/api";
import {
    CreateUnpublishEntryDataFactory as FactoryAbstraction,
    type ICreateUnpublishEntryDataFactory
} from "./abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_UNPUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";

class CreateUnpublishEntryDataFactoryImpl implements ICreateUnpublishEntryDataFactory {
    public constructor(
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

        /**
         * Unpublishing is not a content modification, so saved/modified meta fields are kept.
         * Entry-level values are taken from the latest revision, because storage copies them
         * onto the latest revision when a non-latest revision is unpublished. Revision-level
         * values are the unpublished revision's own, and come from `originalEntry`.
         */
        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_UNPUBLISHED,
            savedOn: getDate(latestEntry.savedOn, originalEntry.savedOn),
            modifiedOn: getDate(latestEntry.modifiedOn),
            savedBy: getIdentity(latestEntry.savedBy, originalEntry.savedBy),
            modifiedBy: getIdentity(latestEntry.modifiedBy),
            live: null
        };

        return Result.ok({ entry });
    }
}

export const CreateUnpublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateUnpublishEntryDataFactoryImpl,
    dependencies: [GetLatestRevisionByEntryIdUseCase]
});
