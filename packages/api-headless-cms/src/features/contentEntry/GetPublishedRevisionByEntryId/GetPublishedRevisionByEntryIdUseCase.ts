import { Result } from "@webiny/feature/api";
import {
    GetPublishedRevisionByEntryIdRepository,
    GetPublishedRevisionByEntryIdUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetPublishedRevisionByEntryIdUseCase - Orchestrates fetching published revision by entry ID.
 *
 * Responsibilities:
 * - Apply model-level access control
 * - Delegate to repository for data fetching
 * - Return null if entry not found or deleted
 *
 * Entry-level (owner) access is checked by GetPublishedRevisionByEntryIdOwnEntriesDecorator.
 */
class GetPublishedRevisionByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: GetPublishedRevisionByEntryIdRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T> | null, UseCaseAbstraction.Error>> {
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

export const GetPublishedRevisionByEntryIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPublishedRevisionByEntryIdUseCaseImpl,
    dependencies: [GetPublishedRevisionByEntryIdRepository, AccessControl]
});
