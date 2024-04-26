import {
    IGetIdentity,
    IGetWebsocketsContextCallable,
    IHasFullAccessCallable,
    ILockingMechanismModelManager
} from "~/types";
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
import { KickOutCurrentUserUseCase } from "./KickOutCurrentUser/KickOutCurrentUserUseCase";
import { GetLockedEntryLockRecordUseCase } from "~/useCases/GetLockedEntryLockRecord/GetLockedEntryLockRecordUseCase";
import { IListAllLockRecordsUseCase } from "~/abstractions/IListAllLockRecordsUseCase";
import { IListLockRecordsUseCase } from "~/abstractions/IListLockRecordsUseCase";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { IIsEntryLockedUseCase } from "~/abstractions/IIsEntryLocked";
import { IGetLockedEntryLockRecordUseCase } from "~/abstractions/IGetLockedEntryLockRecordUseCase";
import { ILockEntryUseCase } from "~/abstractions/ILockEntryUseCase";
import { IUpdateEntryLockUseCase } from "~/abstractions/IUpdateEntryLockUseCase";
import { IUnlockEntryUseCase } from "~/abstractions/IUnlockEntryUseCase";
import { IUnlockEntryRequestUseCase } from "~/abstractions/IUnlockEntryRequestUseCase";

export interface ICreateUseCasesParams {
    getIdentity: IGetIdentity;
    getManager(): Promise<ILockingMechanismModelManager>;
    hasFullAccess: IHasFullAccessCallable;
    getWebsockets: IGetWebsocketsContextCallable;
}

export interface ICreateUseCasesResponse {
    listAllLockRecordsUseCase: IListAllLockRecordsUseCase;
    listLockRecordsUseCase: IListLockRecordsUseCase;
    getLockRecordUseCase: IGetLockRecordUseCase;
    isEntryLockedUseCase: IIsEntryLockedUseCase;
    getLockedEntryLockRecordUseCase: IGetLockedEntryLockRecordUseCase;
    lockEntryUseCase: ILockEntryUseCase;
    updateEntryLockUseCase: IUpdateEntryLockUseCase;
    unlockEntryUseCase: IUnlockEntryUseCase;
    unlockEntryRequestUseCase: IUnlockEntryRequestUseCase;
}

export const createUseCases = (params: ICreateUseCasesParams): ICreateUseCasesResponse => {
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

    const getLockedEntryLockRecordUseCase = new GetLockedEntryLockRecordUseCase({
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

    const kickOutCurrentUserUseCase = new KickOutCurrentUserUseCase({
        getWebsockets: params.getWebsockets
    });

    const unlockEntryUseCase = new UnlockEntryUseCase({
        getLockRecordUseCase,
        kickOutCurrentUserUseCase,
        getManager: params.getManager,
        getIdentity: params.getIdentity,
        hasFullAccess: params.hasFullAccess
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
        getLockedEntryLockRecordUseCase,
        lockEntryUseCase,
        updateEntryLockUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    };
};
