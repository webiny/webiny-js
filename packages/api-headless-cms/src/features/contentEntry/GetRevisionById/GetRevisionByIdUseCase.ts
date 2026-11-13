import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionByIdRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { canAccessLoadedEntry } from "~/features/contentEntry/shared/entryOwnerAccess.js";

/**
 * GetRevisionByIdUseCase - Fetches a specific entry revision.
 *
 * Responsibilities:
 * - Apply model-level access control
 * - Delegate to repository for data fetching
 * - Apply entry-level access control (e.g. "own entries only")
 */
class GetRevisionByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: GetRevisionByIdRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const result = await this.repository.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const entry = result.value;

        const canAccessEntry = await canAccessLoadedEntry(this.accessControl, model, entry);
        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
        }

        return Result.ok(entry);
    }
}

export const GetRevisionByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRevisionByIdUseCaseImpl,
    dependencies: [GetRevisionByIdRepository, AccessControl]
});
