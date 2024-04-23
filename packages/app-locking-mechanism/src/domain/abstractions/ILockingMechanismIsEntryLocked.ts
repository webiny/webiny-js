import { GenericRecord } from "@webiny/app/types";

export interface ILockingMechanismIsEntryLockedParams {
    id: string;
    type: string;
}

export type ILockingMechanismIsEntryLockedResult = GenericRecord;

export interface ILockingMechanismIsEntryLocked {
    execute(
        params: ILockingMechanismIsEntryLockedParams
    ): Promise<ILockingMechanismIsEntryLockedResult>;
}
