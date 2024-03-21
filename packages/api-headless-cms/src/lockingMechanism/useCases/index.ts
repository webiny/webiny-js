import { ICmsModelLockRecordManager } from "~/lockingMechanism/types";
import { GetLockRecordUseCase } from "./GetLockRecord/GetLockRecordUseCase";
import { IsEntryLockedUseCase } from "./IsEntryLocked/IsEntryLockedUseCase";
import { LockEntryUseCase } from "./LockEntryUseCase/LockEntryUseCase";
import { UnlockEntryUseCase } from "./UnlockEntryUseCase/UnlockEntryUseCase";

export interface CreateUseCasesParams {
    getManager(): Promise<ICmsModelLockRecordManager>;
}

export const createUseCases = (params: CreateUseCasesParams) => {
    const getLockRecordUseCase = new GetLockRecordUseCase({
        getManager: params.getManager
    });

    const isEntryLockedUseCase = new IsEntryLockedUseCase({
        getLockRecordUseCase
    });

    const lockEntryUseCase = new LockEntryUseCase({
        isEntryLockedUseCase,
        getManager: params.getManager
    });

    const unlockEntryUseCase = new UnlockEntryUseCase({
        isEntryLockedUseCase,
        getManager: params.getManager
    });

    return {
        getLockRecordUseCase,
        isEntryLockedUseCase,
        lockEntryUseCase,
        unlockEntryUseCase
    };
};
