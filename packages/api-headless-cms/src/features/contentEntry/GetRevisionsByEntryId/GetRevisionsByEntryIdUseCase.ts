import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionsByEntryIdRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetRevisionsByEntryIdUseCase - Orchestrates fetching all revisions for an entry.
 *
 * Responsibilities:
 * - Apply access control
 * - Delegate to repository for data fetching
 */
class GetRevisionsByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: GetRevisionsByEntryIdRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, entryId);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetRevisionsByEntryIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRevisionsByEntryIdUseCaseImpl,
    dependencies: [GetRevisionsByEntryIdRepository, AccessControl]
});
