import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { createIdentifier } from "@webiny/utils";
import { GetLockRecordRepository as RepositoryAbstraction } from "./abstractions.js";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/types.js";
import { LockRecordNotFoundError, LockRecordPersistenceError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

class GetLockRecordRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private model: RecordLockingModel.Interface,
        private config: RecordLockingConfig.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async get(id: string): Promise<Result<ILockRecord, RepositoryAbstraction.Error>> {
        const recordId = createLockRecordDatabaseId(id);
        const entryId = createIdentifier({
            id: recordId,
            version: 1
        });

        const result = await this.getEntryById.execute<LockRecordValues>(this.model, entryId);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LockRecordNotFoundError());
            }

            return Result.fail(new LockRecordPersistenceError(result.error));
        }

        const entry = result.value;

        return Result.ok(new LockRecord(entry, this.config.timeout));
    }
}

export const GetLockRecordRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLockRecordRepositoryImpl,
    dependencies: [RecordLockingModel, RecordLockingConfig, GetEntryByIdUseCase]
});
