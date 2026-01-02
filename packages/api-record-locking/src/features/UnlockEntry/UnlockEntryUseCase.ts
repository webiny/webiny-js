import { Result } from "@webiny/feature/api";
import {
    UnlockEntryUseCase as UseCaseAbstraction,
    UnlockEntryRepository,
    UnlockEntryInput
} from "./abstractions.js";
import { GetLockRecordUseCase } from "../GetLockRecord/abstractions.js";
import { KickOutCurrentUserUseCase } from "../KickOutCurrentUser/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecordNotFoundError, IdentityMismatchError } from "~/domain/errors.js";
import { hasFullAccessPermission } from "./hasFullAccessPermission.js";

class UnlockEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLockRecord: GetLockRecordUseCase.Interface,
        private kickOutCurrentUser: KickOutCurrentUserUseCase.Interface,
        private repository: UnlockEntryRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(input: UnlockEntryInput): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Get the lock record
        const recordResult = await this.getLockRecord.execute(input);

        // If not found or expired, attempt cleanup and return error
        if (recordResult.isFail()) {
            if (recordResult.error instanceof LockRecordNotFoundError) {
                // Try to cleanup any stale data
                await this.repository.delete(input.id);
            }

            return Result.fail(recordResult.error);
        }

        const record = recordResult.value;

        // If expired, cleanup and return error
        if (record.isExpired()) {
            await this.repository.delete(record.id);
            const error = new LockRecordNotFoundError();
            return Result.fail(error);
        }

        // Check if user is the owner
        const identity = this.identityContext.getIdentity();
        const isSameUser = record.lockedBy.id === identity.id;

        let shouldKickOut = false;

        // If not the owner, check if force unlock is allowed
        if (!isSameUser) {
            if (!input.force) {
                const error = new IdentityMismatchError({
                    currentId: identity.id,
                    targetId: record.lockedBy.id
                });
                return Result.fail(error);
            }

            // Check if user has permission to force unlock
            const hasAccess = await hasFullAccessPermission(this.identityContext);
            if (!hasAccess) {
                const error = new IdentityMismatchError({
                    currentId: identity.id,
                    targetId: record.lockedBy.id
                });
                return Result.fail(error);
            }

            shouldKickOut = true;
        }

        // Delete the lock record
        const deleteResult = await this.repository.delete(record.id);

        if (deleteResult.isFail()) {
            return Result.fail(deleteResult.error);
        }

        // If forced by another user, kick out the original lock owner
        if (shouldKickOut) {
            await this.kickOutCurrentUser.execute(record);
        }

        return Result.ok(record);
    }
}

export const UnlockEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnlockEntryUseCaseImpl,
    dependencies: [
        GetLockRecordUseCase,
        KickOutCurrentUserUseCase,
        UnlockEntryRepository,
        IdentityContext
    ]
});
