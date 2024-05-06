import { IRecordLockingLockRecord } from "~/types";

export interface IIsLocked {
    (record?: Pick<IRecordLockingLockRecord, "lockedOn"> | null): boolean;
}

export const isLockedFactory = (timeoutInput: number): IIsLocked => {
    const timeout = timeoutInput * 1000;
    return record => {
        if (!record || record.lockedOn instanceof Date === false) {
            return false;
        }
        const now = new Date().getTime();
        const lockedOn = record.lockedOn.getTime();
        return lockedOn + timeout >= now;
    };
};
