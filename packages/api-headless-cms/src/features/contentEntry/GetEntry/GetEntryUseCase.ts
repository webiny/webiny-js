import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesUseCase } from "../ListEntries/abstractions.js";
import type { CmsEntry, CmsEntryGetParams, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * GetEntryUseCase - Gets a single entry by query.
 * Delegates to ListEntriesUseCase with limit 1 and returns first entry.
 */
class GetEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listEntriesUseCase: ListEntriesUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryGetParams
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const listParams = {
            ...params,
            limit: 1
        };

        const result = await this.listEntriesUseCase.execute<T>(model, listParams);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const { entries } = result.value;
        const entry = entries[0];

        if (!entry) {
            return Result.fail(new EntryNotFoundError());
        }

        return Result.ok(entry);
    }
}

export const GetEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetEntryUseCaseImpl,
    dependencies: [ListEntriesUseCase]
});
