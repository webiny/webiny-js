import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryLockRepository as RepositoryAbstraction } from "./abstractions.js";
import { RecordLockingConfig } from "~/domain/abstractions.js";
import { RecordLockingModelProvider } from "~/domain/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/types.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { LockRecordPersistenceError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

class UpdateEntryLockRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: RecordLockingModelProvider.Interface,
        private config: RecordLockingConfig.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async update(
        lockRecordId: string,
        updateOwner: boolean
    ): Promise<Result<ILockRecord, RepositoryAbstraction.Error>> {
        try {
            const model = await this.modelProvider.get();

            const entryId = createLockRecordDatabaseId(lockRecordId);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });

            if (updateOwner) {
                return await this.changeOwner(model, entryId, id);
            }

            const result = await this.updateEntry.execute(model, id, {
                savedOn: new Date().toISOString()
            });

            if (result.isFail()) {
                return Result.fail(new LockRecordPersistenceError(result.error));
            }

            // Fetch the updated entry to return full lock record
            const getResult = await this.getEntryById.execute<LockRecordValues>(model, id);

            if (getResult.isFail()) {
                return Result.fail(new LockRecordPersistenceError(getResult.error));
            }

            const entry = getResult.value;
            const lockRecord = new LockRecord(entry, this.config.timeout);

            return Result.ok(lockRecord);
        } catch (error) {
            return Result.fail(new LockRecordPersistenceError(error as Error));
        }
    }

    /**
     * The lock owner is the entry owner (createdBy), which cannot be changed through an
     * entry update. The expired lock record is deleted and created again, as the current identity.
     */
    private async changeOwner(
        model: CmsModel,
        entryId: string,
        id: string
    ): Promise<Result<ILockRecord, RepositoryAbstraction.Error>> {
        const existingResult = await this.getEntryById.execute<LockRecordValues>(model, id);
        if (existingResult.isFail()) {
            return Result.fail(new LockRecordPersistenceError(existingResult.error));
        }
        const existing = existingResult.value;

        const deleteResult = await this.deleteEntry.execute(model, id, {
            permanently: true
        });
        if (deleteResult.isFail()) {
            return Result.fail(new LockRecordPersistenceError(deleteResult.error));
        }

        const values: LockRecordValues = {
            targetId: existing.values.targetId,
            type: existing.values.type,
            actions: existing.values.actions || []
        };

        const createResult = await this.createEntry.execute(model, {
            id: entryId,
            values
        });
        if (createResult.isFail()) {
            return Result.fail(new LockRecordPersistenceError(createResult.error));
        }

        const entry = createResult.value as CmsEntry<LockRecordValues>;
        return Result.ok(new LockRecord(entry, this.config.timeout));
    }
}

export const UpdateEntryLockRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateEntryLockRepositoryImpl,
    dependencies: [
        RecordLockingModelProvider,
        RecordLockingConfig,
        UpdateEntryUseCase,
        GetEntryByIdUseCase,
        CreateEntryUseCase,
        DeleteEntryUseCase
    ]
});
