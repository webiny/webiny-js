import { createDecorator } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "../abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel, CmsDeleteEntryOptions } from "~/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * Handles force delete logic for cleanup scenarios.
 *
 * When force=true and entry doesn't exist, this decorator directly calls storage
 * operations to clean up any orphaned records (e.g., in Elasticsearch when DynamoDB
 * record is already deleted).
 */
class ForceDeleteDecoratorImpl implements DeleteEntryUseCase.Interface {
    constructor(
        private storageOperations: StorageOperations.Interface,
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
}

export const ForceDeleteDecorator = createDecorator({
    abstraction: DeleteEntryUseCase,
    decorator: ForceDeleteDecoratorImpl,
    dependencies: [StorageOperations]
});
