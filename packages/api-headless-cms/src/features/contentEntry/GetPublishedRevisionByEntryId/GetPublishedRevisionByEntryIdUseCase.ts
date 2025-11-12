import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPublishedRevisionByEntryIdRepository } from "./abstractions.js";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * GetPublishedRevisionByEntryIdUseCase - Orchestrates fetching published revision by entry ID.
 *
 * Responsibilities:
 * - Delegate to repository for data fetching
 * - Return null if entry not found or deleted
 */
class GetPublishedRevisionByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPublishedRevisionByEntryIdRepository.Interface) {}

    async execute(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry | null, UseCaseAbstraction.Error>> {
        // Delegate to repository
        const result = await this.repository.execute(model, entryId);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetPublishedRevisionByEntryIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetPublishedRevisionByEntryIdUseCaseImpl,
    dependencies: [GetPublishedRevisionByEntryIdRepository]
});
