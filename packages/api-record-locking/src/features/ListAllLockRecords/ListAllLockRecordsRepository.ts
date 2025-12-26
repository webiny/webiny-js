import { Result } from "@webiny/feature/api";
import {
    ListAllLockRecordsRepository as RepositoryAbstraction,
    ListAllLockRecordsInput,
    ListAllLockRecordsOutput
} from "./abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { LockRecordPersistenceError } from "~/domain/errors.js";
import { convertWhereCondition } from "~/utils/convertWhereCondition.js";
import { LockRecord } from "~/domain/LockRecord.js";
import type { LockRecordValues } from "~/domain/index.js";

class ListAllLockRecordsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private config: RecordLockingConfig.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface,
        private model: CmsModel
    ) {}

    async execute(
        input?: ListAllLockRecordsInput
    ): Promise<Result<ListAllLockRecordsOutput, RepositoryAbstraction.Error>> {
        try {
            const params = {
                ...input,
                where: convertWhereCondition(input?.where)
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

export const ListAllLockRecordsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListAllLockRecordsRepositoryImpl,
    dependencies: [RecordLockingConfig, ListLatestEntriesUseCase, RecordLockingModel]
});
