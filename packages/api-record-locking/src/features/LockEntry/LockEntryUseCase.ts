import { Result } from "@webiny/feature/api";
import {
    LockEntryUseCase as UseCaseAbstraction,
    LockEntryRepository,
    LockEntryInput
} from "./abstractions.js";
import { IsEntryLockedUseCase } from "../IsEntryLocked/abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";
import { EntryAlreadyLockedError, LockEntryError } from "~/domain/errors.js";

class LockEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private isEntryLocked: IsEntryLockedUseCase.Interface,
        private repository: LockEntryRepository.Interface
    ) {}

    async execute(input: LockEntryInput): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Check if entry is already locked
        const lockedResult = await this.isEntryLocked.execute(input);

        if (lockedResult.isFail()) {
            return Result.fail(lockedResult.error);
        }

        if (lockedResult.value) {
            return Result.fail(new EntryAlreadyLockedError({ id: input.id, type: input.type }));
        }

        // Create the lock
        const result = await this.repository.create(input);

        if (result.isFail()) {
            // Wrap persistence errors in domain error
            return Result.fail(new LockEntryError(result.error));
        }

        return Result.ok(result.value);
    }
}

export const LockEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: LockEntryUseCaseImpl,
    dependencies: [IsEntryLockedUseCase, LockEntryRepository]
});
