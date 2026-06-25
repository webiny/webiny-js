import { createAbstraction } from "@webiny/feature/api";
import type { AcoStorageOperations as IAcoStorageOperations } from "~/types.js";

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
