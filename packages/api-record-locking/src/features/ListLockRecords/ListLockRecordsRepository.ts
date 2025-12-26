import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import {
    ListLockRecordsRepository as RepositoryAbstraction,
    ListLockRecordsInput,
    ListLockRecordsOutput
} from "./abstractions.js";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/abstractions.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/types.js";
import { LockRecordPersistenceError } from "~/domain/errors.js";
import { convertWhereCondition } from "~/utils/convertWhereCondition.js";

class ListLockRecordsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private model: RecordLockingModel.Interface,
        private config: RecordLockingConfig.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(
        input?: ListLockRecordsInput
    ): Promise<Result<ListLockRecordsOutput, RepositoryAbstraction.Error>> {
        try {
            const params = {
                ...input,
                where: convertWhereCondition(input?.where || {})
            };

            const result = await this.listEntries.execute<LockRecordValues>(this.model, params);

            if (result.isFail()) {
                return Result.fail(new LockRecordPersistenceError(result.error));
            }

            const { entries, meta } = result.value;

            const items = entries.map(entry => new LockRecord(entry, this.config.timeout));

            return Result.ok({
                items,
                meta
            });
        } catch (error) {
            return Result.fail(new LockRecordPersistenceError(error as Error));
        }
    }
}

export const ListLockRecordsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLockRecordsRepositoryImpl,
    dependencies: [RecordLockingModel, RecordLockingConfig, ListLatestEntriesUseCase]
});
