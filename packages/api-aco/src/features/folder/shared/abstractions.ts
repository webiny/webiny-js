import { createAbstraction } from "@webiny/feature/api";
import type { AcoStorageOperations as IAcoStorageOperations } from "~/types.js";
import type {
    AcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "~/flp/flp.types.js";

/** Storage operations for folder filtering. */
export const FilterStorageOperations =
    createAbstraction<IAcoStorageOperations["filter"]>("FilterStorageOperations");

export namespace FilterStorageOperations {
    export type Interface = IAcoStorageOperations["filter"];
}

export const FlpStorageOperations =
    createAbstraction<IAcoStorageOperations["flp"]>("FlpStorageOperations");

export namespace FlpStorageOperations {
    export type Interface = AcoFolderLevelPermissionsStorageOperations;
    export type ListParams = StorageOperationsListFlpsParams;
    export type CreateParams = StorageOperationsCreateFlpParams;
    export type UpdateParams = StorageOperationsUpdateFlpParams;
    export type GetParams = StorageOperationsGetFlpParams;
    export type DeleteParams = StorageOperationsDeleteFlpParams;
    export type BatchUpdateParams = StorageOperationsBatchUpdateFlpParams;
    export type Permission = FolderLevelPermission;
}
