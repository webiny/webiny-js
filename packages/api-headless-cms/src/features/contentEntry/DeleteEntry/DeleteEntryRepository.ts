import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * DeleteEntryRepository - Handles storage operations for permanently deleting entries.
 */
class DeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute(
        initialModel: CmsModel,
        initialEntry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);
        const entry = this.runtimeTenant.assign(initialEntry);

        try {
            await this.storageOperations.entries.delete(model, { entry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const DeleteEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteEntryRepositoryImpl,
    dependencies: [StorageOperations, RuntimeTenant]
});
