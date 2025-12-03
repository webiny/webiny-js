import { createAbstraction } from "@webiny/feature/api";
import type { AcoStorageOperations as IAcoStorageOperations } from "~/types.js";

export const FilterStorageOperations =
    createAbstraction<IAcoStorageOperations["filter"]>("FilterStorageOperations");

export namespace FilterStorageOperations {
    export type Interface = IAcoStorageOperations["filter"];
}
