import { ILockingMechanismModelManager } from "~/types";
import { GetLockRecordUseCase } from "./GetLockRecord/GetLockRecordUseCase";
import { IsEntryLockedUseCase } from "./IsEntryLocked/IsEntryLockedUseCase";
import { LockEntryUseCase } from "./LockEntryUseCase/LockEntryUseCase";
import { UnlockEntryUseCase } from "./UnlockEntryUseCase/UnlockEntryUseCase";
import { UnlockEntryRequestUseCase } from "./UnlockRequestUseCase/UnlockEntryRequestUseCase";
import { CmsIdentity } from "~/types";
import { ListLockRecordsUseCase } from "./ListLockRecordsUseCase/ListLockRecordsUseCase";

export interface CreateUseCasesParams {
    getIdentity: () => CmsIdentity;
    getManager(): Promise<ILockingMechanismModelManager>;
}

export const createUseCases = (params: CreateUseCasesParams) => {
    const listLockRecordsUseCase = new ListLockRecordsUseCase({
        getManager: params.getManager
    });

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
        getLockRecordUseCase,
        getManager: params.getManager
    });

    const unlockEntryRequestUseCase = new UnlockEntryRequestUseCase({
        getLockRecordUseCase,
        getIdentity: params.getIdentity,
        getManager: params.getManager
    });

    return {
        listLockRecordsUseCase,
        getLockRecordUseCase,
        isEntryLockedUseCase,
        lockEntryUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    };
};
