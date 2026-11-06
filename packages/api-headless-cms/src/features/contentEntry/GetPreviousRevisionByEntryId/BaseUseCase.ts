import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetPreviousRevisionByEntryIdBaseUseCase as BaseUseCaseAbstraction } from "./abstractions.js";
import { GetPreviousRevisionByEntryIdRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { canAccessLoadedEntry } from "~/features/contentEntry/shared/entryOwnerAccess.js";

/**
 * Orchestrates fetching previous revision by entry ID and version.
 *
 * Responsibilities:
 * - Apply access control
 * - Delegate to repository for data fetching
 * - Returns entry regardless of deleted state (variations handle filtering)
 */
class GetPreviousRevisionByEntryIdUseCaseImpl implements BaseUseCaseAbstraction.Interface {
    public constructor(
        private repository: GetPreviousRevisionByEntryIdRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, BaseUseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const entry = result.value;

        // Check entry-level access (e.g. "own entries only").
        const canAccessEntry = await canAccessLoadedEntry(this.accessControl, model, entry);
        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
        }

        return Result.ok(entry);
    }
}

export const BaseUseCase = createImplementation({
    abstraction: BaseUseCaseAbstraction,
    implementation: GetPreviousRevisionByEntryIdUseCaseImpl,
    dependencies: [GetPreviousRevisionByEntryIdRepository, AccessControl]
});
