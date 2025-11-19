import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

/**
 * RecordLockingConfig - Configuration for record locking timeout
 */
export interface IRecordLockingConfig {
    /**
     * Timeout in milliseconds after which a lock expires
     */
    timeout: number;
}

export const RecordLockingConfig = createAbstraction<IRecordLockingConfig>("RecordLockingConfig");

export namespace RecordLockingConfig {
    export type Interface = IRecordLockingConfig;
}

export const RecordLockingModel = createAbstraction<CmsModel>("RecordLockingModel");

export namespace RecordLockingModel {
    export type Interface = CmsModel;
}
