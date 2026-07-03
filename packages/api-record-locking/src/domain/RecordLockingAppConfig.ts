import { createAbstraction } from "@webiny/feature/api";

export interface IRecordLockingAppConfig {
    timeout: number;
}

export const RecordLockingAppConfig =
    createAbstraction<IRecordLockingAppConfig>("RecordLockingAppConfig");
