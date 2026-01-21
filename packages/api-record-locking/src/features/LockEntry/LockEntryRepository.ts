import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { LockEntryInput, LockEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/types.js";
import { LockRecordPersistenceError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

class LockEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private model: RecordLockingModel.Interface,
        private config: RecordLockingConfig.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async create(input: LockEntryInput): Promise<Result<ILockRecord, RepositoryAbstraction.Error>> {
        try {
            const id = createLockRecordDatabaseId(input.id);

            const values: LockRecordValues = {
                targetId: input.id,
                type: input.type,
                actions: []
            };

            const result = await this.createEntry.execute(this.model, {
                id,
                values
            });

            if (result.isFail()) {
                return Result.fail(new LockRecordPersistenceError(result.error));
            }

            const entry = result.value as CmsEntry<LockRecordValues>;
            const lockRecord = new LockRecord(entry, this.config.timeout);

            return Result.ok(lockRecord);
        } catch (error) {
            return Result.fail(new LockRecordPersistenceError(error as Error));
        }
    }
}

export const LockEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: LockEntryRepositoryImpl,
    dependencies: [RecordLockingModel, RecordLockingConfig, CreateEntryUseCase]
});
