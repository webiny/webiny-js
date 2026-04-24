import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetEntriesByIdsRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";

/**
 * GetEntriesByIdsRepository - Fetches entries by IDs from storage and transforms them.
 * Returns array of entries.
 */
class GetEntriesByIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private tenantContext: TenantContext.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        try {
            const modelWithTenant = { ...model, tenant: this.tenantContext.getTenant().id };
            const result = await this.storageOperations.entries.getByIds<T>(modelWithTenant, {
                ids
            });

            // Transform storage entries to domain entries
            const items = await Promise.all(
                result.map(async entry => {
                    return this.entryFromStorageTransform(model, entry);
                })
            );

            return Result.ok(items);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetEntriesByIdsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetEntriesByIdsRepositoryImpl,
    dependencies: [TenantContext, EntryFromStorageTransform, StorageOperations]
});
