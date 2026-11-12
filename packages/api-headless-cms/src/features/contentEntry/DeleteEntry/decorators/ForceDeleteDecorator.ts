import { createDecorator } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "../abstractions.js";
import { AccessControl, StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel, CmsDeleteEntryOptions } from "~/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryNotAuthorizedError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * Handles force delete logic for cleanup scenarios.
 *
 * When force=true and entry doesn't exist, this decorator directly calls storage
 * operations to clean up any orphaned records (e.g., in Elasticsearch when DynamoDB
 * record is already deleted).
 */
class ForceDeleteDecoratorImpl implements DeleteEntryUseCase.Interface {
    public constructor(
        private storageOperations: StorageOperations.Interface,
        private accessControl: AccessControl.Interface,
        private decoratee: DeleteEntryUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string,
        options: CmsDeleteEntryOptions = {}
    ): Promise<Result<void, DeleteEntryUseCase.Error>> {
        const { force = false } = options;

        const result = await this.decoratee.execute(model, id, options);

        if (force && result.isFail() && result.error.code === "Cms/Entry/NotFound") {
            const { id: entryId } = parseIdentifier(id);

            const canForceDelete = await this.canForceDelete(model, entryId);
            if (!canForceDelete) {
                return Result.fail(new EntryNotAuthorizedError());
            }

            try {
                // Not the nicest way to do it, but we need to revisit storage operations anyway.
                await this.storageOperations.entries.delete(model, {
                    entry: {
                        id,
                        entryId
                    }
                } as any);

                return Result.ok();
            } catch (error) {
                return Result.fail(new EntryPersistenceError(error as Error));
            }
        }

        return result;
    }

    /**
     * Force delete bypasses the use case, so check delete access here. If a record still exists
     * (for example an entry in the bin), the caller must be allowed to delete it. If nothing is
     * left, ownership can't be checked, so an "own entries only" caller is refused.
     */
    private async canForceDelete(model: CmsModel, entryId: string): Promise<boolean> {
        const existing = await this.storageOperations.entries.getLatestRevisionByEntryId(model, {
            id: entryId
        });
        if (existing) {
            return this.accessControl.canAccessEntry({ model, entry: existing, rwd: "d" });
        }
        const canDelete = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canDelete) {
            return false;
        }
        return !(await this.accessControl.canAccessOnlyOwnedEntries({ model }));
    }
}

export const ForceDeleteDecorator = createDecorator({
    abstraction: DeleteEntryUseCase,
    decorator: ForceDeleteDecoratorImpl,
    dependencies: [StorageOperations, AccessControl]
});
