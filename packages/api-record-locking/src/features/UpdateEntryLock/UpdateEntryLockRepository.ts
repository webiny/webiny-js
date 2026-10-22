import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryLockRepository as RepositoryAbstraction } from "./abstractions.js";
import { RecordLockingConfig } from "~/domain/abstractions.js";
import { RecordLockingModelProvider } from "~/domain/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/types.js";
import { LockRecordPersistenceError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

class UpdateEntryLockRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: RecordLockingModelProvider.Interface,
        private config: RecordLockingConfig.Interface,
        private identityContext: IdentityContext.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
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

            const identity = this.identityContext.getIdentity();
            const now = new Date().toISOString();

            // Build update data
            const updateData: any = {
                savedOn: now
            };

            // If updating owner (expired lock), also update created fields
            if (updateOwner) {
                updateData.createdOn = now;
                updateData.createdBy = identity;
                updateData.savedBy = identity;
            }

            const result = await this.updateEntry.execute(model, id, updateData);

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
}

export const UpdateEntryLockRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateEntryLockRepositoryImpl,
    dependencies: [
        RecordLockingModelProvider,
        RecordLockingConfig,
        IdentityContext,
        UpdateEntryUseCase,
        GetEntryByIdUseCase
    ]
});
