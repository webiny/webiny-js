import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestEntriesByIdsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLatestEntriesByIdsRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetLatestEntriesByIdsUseCase - Orchestrates fetching latest entries by IDs.
 *
 * Responsibilities:
 * - Apply access control
 * - Delegate to repository for data fetching
 */
class GetLatestEntriesByIdsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: GetLatestEntriesByIdsRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(ContentEntryNotAuthorizedError.fromModel(model));
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, ids);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetLatestEntriesByIdsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetLatestEntriesByIdsUseCaseImpl,
    dependencies: [GetLatestEntriesByIdsRepository, AccessControl]
});
