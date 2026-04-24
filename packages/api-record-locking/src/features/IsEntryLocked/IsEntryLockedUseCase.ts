import { Result } from "@webiny/feature/api";
import { IsEntryLockedUseCase as UseCaseAbstraction, IsEntryLockedInput } from "./abstractions.js";
import { GetLockRecordUseCase } from "../GetLockRecord/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { LockRecordNotFoundError } from "~/domain/errors.js";

class IsEntryLockedUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLockRecord: GetLockRecordUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(input: IsEntryLockedInput): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const result = await this.getLockRecord.execute(input);

        if (result.isFail()) {
            // If not found, entry is not locked
            if (result.error instanceof LockRecordNotFoundError) {
                return Result.ok(false);
            }
            // Propagate other errors
            return Result.fail(result.error);
        }

        const record = result.value;

        // If expired, entry is not locked
        if (record.isExpired()) {
            return Result.ok(false);
        }

        // Check if locked by someone else
        const identity = this.identityContext.getIdentity();
        const isLockedByOther = record.lockedBy.id !== identity.id;

        return Result.ok(isLockedByOther);
    }
}

export const IsEntryLockedUseCase = UseCaseAbstraction.createImplementation({
    implementation: IsEntryLockedUseCaseImpl,
    dependencies: [GetLockRecordUseCase, IdentityContext]
});
