import { Result } from "@webiny/feature/api";
import {
    UnlockEntryRequestUseCase as UseCaseAbstraction,
    UnlockEntryRequestRepository,
    UnlockEntryRequestInput
} from "./abstractions.js";
import { GetLockRecordUseCase } from "../GetLockRecord/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { ILockRecord } from "~/domain/LockRecord.js";
import {
    EntryNotLockedError,
    UnlockRequestAlreadySentError,
    LockRecordNotFoundError,
    LockRecordPersistenceError
} from "~/domain/errors.js";
import { RecordLockingLockRecordActionType } from "~/domain/types.js";

class UnlockEntryRequestUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLockRecord: GetLockRecordUseCase.Interface,
        private repository: UnlockEntryRequestRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        input: UnlockEntryRequestInput
    ): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Get the lock record
        const recordResult = await this.getLockRecord.execute(input);

        // If not found, it means entry is not locked
        if (recordResult.isFail()) {
            if (recordResult.error instanceof LockRecordNotFoundError) {
                const error = new EntryNotLockedError({ id: input.id, type: input.type });
                return Result.fail(error);
            }
            // Other errors
            return Result.fail(new LockRecordPersistenceError(recordResult.error));
        }

        const record = recordResult.value;

        // If expired, entry is not locked
        if (record.isExpired()) {
            const error = new EntryNotLockedError({ id: input.id, type: input.type });
            return Result.fail(error);
        }

        // Check if unlock request already exists
        const unlockRequested = record.getUnlockRequested();
        if (unlockRequested) {
            const currentIdentity = this.identityContext.getIdentity();

            // If a different user already requested unlock, deny
            if (unlockRequested.createdBy.id !== currentIdentity.id) {
                const error = new UnlockRequestAlreadySentError({
                    id: input.id,
                    type: input.type,
                    identityId: unlockRequested.createdBy.id
                });
                return Result.fail(error);
            }

            // If same user but already approved or denied, return the record
            const approved = record.getUnlockApproved();
            const denied = record.getUnlockDenied();
            if (approved || denied) {
                return Result.ok(record);
            }

            // If same user and pending, treat as duplicate
            const error = new UnlockRequestAlreadySentError({
                id: input.id,
                type: input.type,
                identityId: unlockRequested.createdBy.id
            });
            return Result.fail(error);
        }

        // Add unlock request action
        const identity = this.identityContext.getIdentity();
        record.addAction({
            type: RecordLockingLockRecordActionType.requested,
            createdOn: new Date(),
            createdBy: identity
        });

        // Update the record
        const updateResult = await this.repository.update(record);

        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(record);
    }
}

export const UnlockEntryRequestUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnlockEntryRequestUseCaseImpl,
    dependencies: [GetLockRecordUseCase, UnlockEntryRequestRepository, IdentityContext]
});
