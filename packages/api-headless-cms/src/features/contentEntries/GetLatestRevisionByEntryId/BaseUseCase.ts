import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdBaseUseCase as BaseUseCaseAbstraction } from "./abstractions.js";
import { GetLatestRevisionByEntryIdRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * Orchestrates fetching latest revision by entry ID.
 *
 * Responsibilities:
 * - Apply access control
 * - Delegate to repository for data fetching
 * - Returns entry regardless of deleted state (decorators handle filtering)
 */
class GetLatestRevisionByEntryIdUseCaseImpl implements BaseUseCaseAbstraction.Interface {
    constructor(
        private repository: GetLatestRevisionByEntryIdRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, BaseUseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(new NotAuthorizedError());
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const BaseUseCase = createImplementation({
    abstraction: BaseUseCaseAbstraction,
    implementation: GetLatestRevisionByEntryIdUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdRepository, AccessControl]
});
