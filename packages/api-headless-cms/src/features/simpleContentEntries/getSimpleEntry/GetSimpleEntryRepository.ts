import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import {
    SimpleEntryNotFoundError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    IGetSimpleEntryParams,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import { GetSimpleEntryRepository as RepositoryAbstraction } from "./abstractions/index.js";

class GetSimpleEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private readonly entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private readonly getLatestRevisionStorage: GetLatestRevisionByEntryIdStorageOperation.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IGetSimpleEntryParams
    ): Promise<Result<ISimpleCmsEntry<TValues>, RepositoryAbstraction.Error>> {
        assertSimpleModel(model);

        const entryId = this.resolveEntryId(params);
        if (!entryId) {
            return Result.fail(new SimpleEntryNotFoundError());
        }

        try {
            /*
             * A simple entry has exactly one revision, so the latest revision is the entry. This
             * operation is data-loader backed and keyed by entry id, which makes it cheaper than
             * the generic get.
             */
            const entry = await this.getLatestRevisionStorage.execute<TValues>(model, {
                id: entryId
            });

            if (!entry) {
                return Result.fail(new SimpleEntryNotFoundError(entryId));
            }

            const transformed = await this.entryFromStorageTransform(model, entry);

            return Result.ok(transformed as unknown as ISimpleCmsEntry<TValues>);
        } catch (error) {
            return Result.fail(new SimpleEntryPersistenceError(error as Error));
        }
    }

    private resolveEntryId(params: IGetSimpleEntryParams): string | undefined {
        const { entryId, id } = params.where;
        if (entryId) {
            return entryId;
        }
        if (!id) {
            return undefined;
        }
        return parseIdentifier(id).id;
    }
}

export const GetSimpleEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSimpleEntryRepositoryImpl,
    dependencies: [EntryFromStorageTransform, GetLatestRevisionByEntryIdStorageOperation]
});
