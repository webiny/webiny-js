import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismUnlockEntryRequestParams {
    id: string;
    type: string;
}

export interface ILockingMechanismUnlockEntryRequestResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismUnlockEntryRequest {
    execute(
        params: ILockingMechanismUnlockEntryRequestParams
    ): Promise<ILockingMechanismUnlockEntryRequestResult>;
}
