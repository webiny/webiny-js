import { createImplementation, Result } from "@webiny/feature/api";
import {
    GetPublishedRevisionByEntryIdRepository,
    GetPublishedRevisionByEntryIdUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetPublishedRevisionByEntryIdUseCase - Orchestrates fetching published revision by entry ID.
 *
 * Responsibilities:
 * - Delegate to repository for data fetching
 * - Return null if entry not found or deleted
 */
class GetPublishedRevisionByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private repository: GetPublishedRevisionByEntryIdRepository.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T> | null, UseCaseAbstraction.Error>> {
        // Delegate to repository
        const result = await this.repository.execute<T>(model, entryId);

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
