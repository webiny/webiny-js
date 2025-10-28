import type {
    IGetIdentity,
    IGetWebsocketsContextCallable,
    IHasRecordLockingAccessCallable,
    IRecordLockingModelManager
} from "~/types.js";
import { GetLockRecordUseCase } from "./GetLockRecord/GetLockRecordUseCase.js";
import { IsEntryLockedUseCase } from "./IsEntryLocked/IsEntryLockedUseCase.js";
import { LockEntryUseCase } from "./LockEntryUseCase/LockEntryUseCase.js";
import { UnlockEntryUseCase } from "./UnlockEntryUseCase/UnlockEntryUseCase.js";
import { UnlockEntryRequestUseCase } from "./UnlockRequestUseCase/UnlockEntryRequestUseCase.js";
import { ListAllLockRecordsUseCase } from "./ListAllLockRecordsUseCase/ListAllLockRecordsUseCase.js";
import { ListLockRecordsUseCase } from "./ListLockRecordsUseCase/ListLockRecordsUseCase.js";
import { UpdateEntryLockUseCase } from "~/useCases/UpdateEntryLock/UpdateEntryLockUseCase.js";
import { KickOutCurrentUserUseCase } from "./KickOutCurrentUser/KickOutCurrentUserUseCase.js";
import { GetLockedEntryLockRecordUseCase } from "~/useCases/GetLockedEntryLockRecord/GetLockedEntryLockRecordUseCase.js";
import type { IListAllLockRecordsUseCase } from "~/abstractions/IListAllLockRecordsUseCase.js";
import type { IListLockRecordsUseCase } from "~/abstractions/IListLockRecordsUseCase.js";
import type { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase.js";
import type { IIsEntryLockedUseCase } from "~/abstractions/IIsEntryLocked.js";
import type { IGetLockedEntryLockRecordUseCase } from "~/abstractions/IGetLockedEntryLockRecordUseCase.js";
import type { ILockEntryUseCase } from "~/abstractions/ILockEntryUseCase.js";
import type { IUpdateEntryLockUseCase } from "~/abstractions/IUpdateEntryLockUseCase.js";
import type { IUnlockEntryUseCase } from "~/abstractions/IUnlockEntryUseCase.js";
import type { IUnlockEntryRequestUseCase } from "~/abstractions/IUnlockEntryRequestUseCase.js";
import { convertEntryToLockRecord as baseConvertEntryToLockRecord } from "~/utils/convertEntryToLockRecord.js";
import type { ConvertEntryToLockRecordCb } from "~/useCases/types.js";
import type { Security } from "@webiny/api-core/types/security.js";

export interface ICreateUseCasesParams {
    getTimeout: () => number;
    getIdentity: IGetIdentity;
    getManager(): Promise<IRecordLockingModelManager>;
    getSecurity(): Pick<Security, "withoutAuthorization">;
    hasRecordLockingAccess: IHasRecordLockingAccessCallable;
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
    const { getTimeout } = params;
    const timeout = getTimeout();

    const convertEntryToLockRecord: ConvertEntryToLockRecordCb = entry => {
        return baseConvertEntryToLockRecord(entry, timeout);
    };

    const listAllLockRecordsUseCase = new ListAllLockRecordsUseCase({
        getManager: params.getManager,
        convert: convertEntryToLockRecord
    });

    const listLockRecordsUseCase = new ListLockRecordsUseCase({
        listAllLockRecordsUseCase,
        timeout,
        getIdentity: params.getIdentity
    });

    const getLockRecordUseCase = new GetLockRecordUseCase({
        getManager: params.getManager,
        getSecurity: params.getSecurity,
        convert: convertEntryToLockRecord
    });

    const isEntryLockedUseCase = new IsEntryLockedUseCase({
        getLockRecordUseCase,
        getIdentity: params.getIdentity
    });

    const getLockedEntryLockRecordUseCase = new GetLockedEntryLockRecordUseCase({
        getLockRecordUseCase,
        getIdentity: params.getIdentity
    });

    const lockEntryUseCase = new LockEntryUseCase({
        isEntryLockedUseCase,
        getManager: params.getManager,
        getSecurity: params.getSecurity,
        getIdentity: params.getIdentity,
        convert: convertEntryToLockRecord
    });

    const updateEntryLockUseCase = new UpdateEntryLockUseCase({
        getLockRecordUseCase,
        lockEntryUseCase,
        getManager: params.getManager,
        getSecurity: params.getSecurity,
        getIdentity: params.getIdentity,
        convert: convertEntryToLockRecord
    });

    const kickOutCurrentUserUseCase = new KickOutCurrentUserUseCase({
        getWebsockets: params.getWebsockets,
        getIdentity: params.getIdentity
    });

    const unlockEntryUseCase = new UnlockEntryUseCase({
        getLockRecordUseCase,
        kickOutCurrentUserUseCase,
        getManager: params.getManager,
        getSecurity: params.getSecurity,
        getIdentity: params.getIdentity,
        hasRecordLockingAccess: params.hasRecordLockingAccess
    });

    const unlockEntryRequestUseCase = new UnlockEntryRequestUseCase({
        getLockRecordUseCase,
        getIdentity: params.getIdentity,
        getSecurity: params.getSecurity,
        getManager: params.getManager,
        convert: convertEntryToLockRecord
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
