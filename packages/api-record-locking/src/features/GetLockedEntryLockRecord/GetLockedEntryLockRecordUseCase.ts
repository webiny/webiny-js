import { Result } from "@webiny/feature/api";
import {
    GetLockedEntryLockRecordUseCase as UseCaseAbstraction,
    GetLockedEntryLockRecordInput
} from "./abstractions.js";
import { GetLockRecordUseCase } from "../GetLockRecord/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { LockRecordNotFoundError } from "~/domain/errors.js";

class GetLockedEntryLockRecordUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLockRecord: GetLockRecordUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        input: GetLockedEntryLockRecordInput
    ): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Get the lock record
        const result = await this.getLockRecord.execute(input);

        // If not found or error, return not found error
        if (result.isFail()) {
            return Result.fail(new LockRecordNotFoundError());
        }

        const record = result.value;
        const identity = this.identityContext.getIdentity();

        // Record is treated as "not found":
        // - If locked by current user
        // - If expired
        const lockedByCurrentUser = record.lockedBy.id === identity.id;

        if (record.isExpired() || lockedByCurrentUser) {
            return Result.fail(new LockRecordNotFoundError());
        }

        // Locked by another user, return the record
        return Result.ok(record);
    }
}

export const GetLockedEntryLockRecordUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLockedEntryLockRecordUseCaseImpl,
    dependencies: [GetLockRecordUseCase, IdentityContext]
});
