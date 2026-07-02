import { createAbstraction } from "@webiny/feature/api";
import type { AcoStorageOperations as IAcoStorageOperations } from "~/types.js";
import type { AcoFilterCrud as IAcoFilterCrud } from "~/filter/filter.types.js";
import type { AcoFolderLevelPermissionsCrud } from "~/flp/flp.types.js";

/** Storage operations for folder filtering. */
export const FilterStorageOperations =
    createAbstraction<IAcoStorageOperations["filter"]>("FilterStorageOperations");

export namespace FilterStorageOperations {
    export type Interface = IAcoStorageOperations["filter"];
}

export const FlpStorageOperations =
    createAbstraction<IAcoStorageOperations["flp"]>("FlpStorageOperations");

export namespace FlpStorageOperations {
    export type Interface = IAcoStorageOperations["flp"];
}

export const AcoFlpCrud = createAbstraction<AcoFolderLevelPermissionsCrud>("AcoFlpCrud");

export namespace AcoFlpCrud {
    export type Interface = AcoFolderLevelPermissionsCrud;
}

export const AcoFilterCrud = createAbstraction<IAcoFilterCrud>("AcoFilterCrud");

export namespace AcoFilterCrud {
    export type Interface = IAcoFilterCrud;
}
