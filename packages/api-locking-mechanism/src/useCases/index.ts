import { CmsIdentity, ILockingMechanismModelManager } from "~/types";
import { GetLockRecordUseCase } from "./GetLockRecord/GetLockRecordUseCase";
import { IsEntryLockedUseCase } from "./IsEntryLocked/IsEntryLockedUseCase";
import { LockEntryUseCase } from "./LockEntryUseCase/LockEntryUseCase";
import { UnlockEntryUseCase } from "./UnlockEntryUseCase/UnlockEntryUseCase";
import { UnlockEntryRequestUseCase } from "./UnlockRequestUseCase/UnlockEntryRequestUseCase";
import { ListAllLockRecordsUseCase } from "./ListAllLockRecordsUseCase/ListAllLockRecordsUseCase";
import { ListLockRecordsUseCase } from "./ListLockRecordsUseCase/ListLockRecordsUseCase";
import { isLockedFactory } from "~/utils/isLockedFactory";
import { UpdateEntryLockUseCase } from "~/useCases/UpdateEntryLock/UpdateEntryLockUseCase";
import { getTimeout } from "~/utils/getTimeout";

export interface CreateUseCasesParams {
    getIdentity: () => CmsIdentity;
    getManager(): Promise<ILockingMechanismModelManager>;
}

export const createUseCases = (params: CreateUseCasesParams) => {
    const timeout = getTimeout();
    const isLocked = isLockedFactory(timeout);

    const listAllLockRecordsUseCase = new ListAllLockRecordsUseCase({
        getManager: params.getManager
    });

    const listLockRecordsUseCase = new ListLockRecordsUseCase({
        listAllLockRecordsUseCase,
        timeout,
        getIdentity: params.getIdentity
    });

    const getLockRecordUseCase = new GetLockRecordUseCase({
        getManager: params.getManager
    });

    const isEntryLockedUseCase = new IsEntryLockedUseCase({
        getLockRecordUseCase,
        isLocked,
        getIdentity: params.getIdentity
    });

    const lockEntryUseCase = new LockEntryUseCase({
        isEntryLockedUseCase,
        getManager: params.getManager
    });

    const updateEntryLockUseCase = new UpdateEntryLockUseCase({
        getLockRecordUseCase,
        lockEntryUseCase,
        getManager: params.getManager,
        getIdentity: params.getIdentity
    });

    const unlockEntryUseCase = new UnlockEntryUseCase({
        getLockRecordUseCase,
        getManager: params.getManager,
        getIdentity: params.getIdentity
    });

    const unlockEntryRequestUseCase = new UnlockEntryRequestUseCase({
        getLockRecordUseCase,
        getIdentity: params.getIdentity,
        getManager: params.getManager
    });

    return {
        listAllLockRecordsUseCase,
        listLockRecordsUseCase,
        getLockRecordUseCase,
        isEntryLockedUseCase,
        lockEntryUseCase,
        updateEntryLockUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    };
};
