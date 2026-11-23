import { createAbstraction } from "@webiny/feature/api";

export interface IDiskStorageConfig {
    /** Absolute path of the folder. */
    readonly path: string;
}

/** The folder `DiskObjectStorage` keeps files in. */
export const DiskStorageConfig = createAbstraction<IDiskStorageConfig>("ObjectStorage/DiskConfig");

export namespace DiskStorageConfig {
    export type Interface = IDiskStorageConfig;
}

/** The value `<DiskStorage />` gives the `OBJECT_STORAGE_BUILD_PARAM` build param. */
export const DISK_OBJECT_STORAGE = "disk";
