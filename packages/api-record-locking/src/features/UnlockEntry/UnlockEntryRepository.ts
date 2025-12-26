import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { createIdentifier } from "@webiny/utils";
import { UnlockEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { RecordLockingModel } from "~/domain/abstractions.js";
import { LockRecordNotFoundError, UnlockEntryError } from "~/domain/errors.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

class UnlockEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private model: RecordLockingModel.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async delete(lockRecordId: string): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const entryId = createLockRecordDatabaseId(lockRecordId);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });

            const result = await this.deleteEntry.execute(this.model, id, {
                permanently: true
            });

            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/NotFound") {
                    return Result.fail(new LockRecordNotFoundError());
                }
                return Result.fail(new UnlockEntryError(result.error));
            }

            return Result.ok();
        } catch (error) {
            return Result.fail(new UnlockEntryError(error as Error));
        }
    }
}

export const UnlockEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UnlockEntryRepositoryImpl,
    dependencies: [RecordLockingModel, DeleteEntryUseCase]
});
