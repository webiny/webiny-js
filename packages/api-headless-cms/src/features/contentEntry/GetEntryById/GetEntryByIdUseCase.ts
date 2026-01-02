import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetEntryByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetEntriesByIdsUseCase } from "../GetEntriesByIds/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * GetEntryByIdUseCase - Gets a single entry by ID.
 * Delegates to GetEntriesByIdsUseCase and returns the first entry.
 */
class GetEntryByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private getEntriesByIdsUseCase: GetEntriesByIdsUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const result = await this.getEntriesByIdsUseCase.execute<T>(model, [id]);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const entries = result.value;
        const entry = entries[0];

        if (!entry) {
            return Result.fail(new EntryNotFoundError(id));
        }

        return Result.ok(entry);
    }
}

export const GetEntryByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetEntryByIdUseCaseImpl,
    dependencies: [GetEntriesByIdsUseCase]
});
