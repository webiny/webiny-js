import { Result } from "@webiny/feature/api";
import { UnlockEntryRequestRepository as RepositoryAbstraction } from "./abstractions.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { RecordLockingModel } from "~/domain/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { UnlockEntryRequestError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";
import { createIdentifier } from "@webiny/utils";

class UnlockEntryRequestRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private model: CmsModel
    ) {}

    async update(record: ILockRecord): Promise<Result<ILockRecord, RepositoryAbstraction.Error>> {
        try {
            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });

            const result = await this.identityContext.withoutAuthorization(async () => {
                return await this.updateEntry.execute(this.model, id, record.toObject());
            });

            if (result.isFail()) {
                return Result.fail(new UnlockEntryRequestError(result.error));
            }

            return Result.ok(record);
        } catch (error) {
            return Result.fail(new UnlockEntryRequestError(error as Error));
        }
    }
}

export const UnlockEntryRequestRepository = RepositoryAbstraction.createImplementation({
    implementation: UnlockEntryRequestRepositoryImpl,
    dependencies: [UpdateEntryUseCase, IdentityContext, RecordLockingModel]
});
