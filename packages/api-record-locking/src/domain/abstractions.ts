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

/**
 * RecordLockingModelProvider - Fetches the private CMS model that stores lock records
 */
export interface IRecordLockingModelProvider {
    get(): Promise<CmsModel>;
}

export const RecordLockingModelProvider = createAbstraction<IRecordLockingModelProvider>(
    "RecordLockingModelProvider"
);

export namespace RecordLockingModelProvider {
    export type Interface = IRecordLockingModelProvider;
}
