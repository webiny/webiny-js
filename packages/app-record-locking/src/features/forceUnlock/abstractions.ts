import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface IForceUnlockParams {
    id: string;
    type: string;
}

export interface IForceUnlockGateway {
    execute(params: IForceUnlockParams): Promise<IRecordLockingLockRecord>;
}

export const ForceUnlockGateway = createAbstraction<IForceUnlockGateway>("ForceUnlockGateway");

export namespace ForceUnlockGateway {
    export type Interface = IForceUnlockGateway;
}

export interface IForceUnlockUseCase {
    execute(params: IForceUnlockParams): Promise<IRecordLockingLockRecord>;
}

export const ForceUnlockUseCase = createAbstraction<IForceUnlockUseCase>("ForceUnlockUseCase");

export namespace ForceUnlockUseCase {
    export type Interface = IForceUnlockUseCase;
}
