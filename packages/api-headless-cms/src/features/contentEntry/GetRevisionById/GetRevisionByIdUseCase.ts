import { Result } from "@webiny/feature/api";
import { GetRevisionByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionByIdRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetRevisionByIdUseCase - Fetches a specific entry revision.
 *
 * Responsibilities:
 * - Apply model-level access control
 * - Delegate to repository for data fetching
 *
 * Entry-level (owner) access is checked by GetRevisionByIdOwnEntriesDecorator.
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

        return this.repository.execute<T>(model, id);
    }
}

export const GetRevisionByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRevisionByIdUseCaseImpl,
    dependencies: [GetRevisionByIdRepository, AccessControl]
});
