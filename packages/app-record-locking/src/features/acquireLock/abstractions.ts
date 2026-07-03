import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface IAcquireLockParams {
    id: string;
    type: string;
}

export interface IAcquireLockGateway {
    execute(params: IAcquireLockParams): Promise<IRecordLockingLockRecord>;
}

export const AcquireLockGateway = createAbstraction<IAcquireLockGateway>("AcquireLockGateway");

export namespace AcquireLockGateway {
    export type Interface = IAcquireLockGateway;
}

export interface IAcquireLockUseCase {
    execute(params: IAcquireLockParams): Promise<IRecordLockingLockRecord>;
}

export const AcquireLockUseCase = createAbstraction<IAcquireLockUseCase>("AcquireLockUseCase");

export namespace AcquireLockUseCase {
    export type Interface = IAcquireLockUseCase;
}
