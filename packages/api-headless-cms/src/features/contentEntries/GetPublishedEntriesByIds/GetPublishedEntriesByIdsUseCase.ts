import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPublishedEntriesByIdsRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * GetPublishedEntriesByIdsUseCase - Orchestrates fetching published entries by IDs.
 *
 * Responsibilities:
 * - Apply access control
 * - Delegate to repository for data fetching
 */
class GetPublishedEntriesByIdsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: GetPublishedEntriesByIdsRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(new NotAuthorizedError());
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, ids);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetPublishedEntriesByIdsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetPublishedEntriesByIdsUseCaseImpl,
    dependencies: [GetPublishedEntriesByIdsRepository, AccessControl]
});
