import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface IReleaseLockParams {
    id: string;
    type: string;
}

export interface IReleaseLockGateway {
    execute(params: IReleaseLockParams): Promise<IRecordLockingLockRecord>;
}

export const ReleaseLockGateway = createAbstraction<IReleaseLockGateway>("ReleaseLockGateway");

export namespace ReleaseLockGateway {
    export type Interface = IReleaseLockGateway;
}

export interface IReleaseLockUseCase {
    execute(params: IReleaseLockParams): Promise<IRecordLockingLockRecord>;
}

export const ReleaseLockUseCase = createAbstraction<IReleaseLockUseCase>("ReleaseLockUseCase");

export namespace ReleaseLockUseCase {
    export type Interface = IReleaseLockUseCase;
}
