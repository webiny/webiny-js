import { Result } from "@webiny/feature/api";
import {
    UpdateEntryLockUseCase as UseCaseAbstraction,
    UpdateEntryLockRepository,
    UpdateEntryLockInput
} from "./abstractions.js";
import { GetLockRecordUseCase } from "../GetLockRecord/abstractions.js";
import { LockEntryUseCase } from "../LockEntry/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import {
    LockRecordNotFoundError,
    IdentityMismatchError,
    UpdateEntryLockError
} from "~/domain/errors.js";

class UpdateEntryLockUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLockRecord: GetLockRecordUseCase.Interface,
        private lockEntry: LockEntryUseCase.Interface,
        private repository: UpdateEntryLockRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        input: UpdateEntryLockInput
    ): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Try to get existing lock record
        const recordResult = await this.getLockRecord.execute(input);

        // If doesn't exist, create a new lock
        if (recordResult.isFail()) {
            if (recordResult.error instanceof LockRecordNotFoundError) {
                const lockResult = await this.lockEntry.execute(input);
                if (lockResult.isFail()) {
                    return Result.fail(new UpdateEntryLockError(lockResult.error));
                }
                return Result.ok(lockResult.value);
            }
            return Result.fail(recordResult.error);
        }

        const record = recordResult.value;

        // If expired, update with current user as new owner
        if (record.isExpired()) {
            const updateResult = await this.repository.update(record.id, true);
            if (updateResult.isFail()) {
                return Result.fail(new UpdateEntryLockError(updateResult.error));
            }
            return Result.ok(updateResult.value);
        }

        // If not expired, validate same owner
        const identity = this.identityContext.getIdentity();
        if (record.lockedBy.id !== identity.id) {
            return Result.fail(
                new IdentityMismatchError({
                    currentId: identity.id,
                    targetId: record.lockedBy.id
                })
            );
        }

        // Update timestamp only
        const updateResult = await this.repository.update(record.id, false);
        if (updateResult.isFail()) {
            return Result.fail(new UpdateEntryLockError(updateResult.error));
        }

        return Result.ok(updateResult.value);
    }
}

export const UpdateEntryLockUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateEntryLockUseCaseImpl,
    dependencies: [
        GetLockRecordUseCase,
        LockEntryUseCase,
        UpdateEntryLockRepository,
        IdentityContext
    ]
});
