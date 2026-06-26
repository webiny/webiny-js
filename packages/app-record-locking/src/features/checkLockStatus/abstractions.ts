import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface ICheckLockStatusParams {
    id: string;
    type: string;
}

export interface ICheckLockStatusGateway {
    execute(params: ICheckLockStatusParams): Promise<IRecordLockingLockRecord | null>;
}

export const CheckLockStatusGateway =
    createAbstraction<ICheckLockStatusGateway>("CheckLockStatusGateway");

export namespace CheckLockStatusGateway {
    export type Interface = ICheckLockStatusGateway;
}

export interface ICheckLockStatusUseCase {
    execute(params: ICheckLockStatusParams): Promise<IRecordLockingLockRecord | null>;
}

export const CheckLockStatusUseCase =
    createAbstraction<ICheckLockStatusUseCase>("CheckLockStatusUseCase");

export namespace CheckLockStatusUseCase {
    export type Interface = ICheckLockStatusUseCase;
}
