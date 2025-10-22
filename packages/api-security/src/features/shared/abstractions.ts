import { createAbstraction } from "@webiny/feature/api";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "~/types.js";

/**
 * SecurityStorageOperations abstraction
 * Provides access to all storage operations for security entities
 */
export const SecurityStorageOperations = createAbstraction<ISecurityStorageOperations>(
    "SecurityStorageOperations"
);

export namespace SecurityStorageOperations {
    export type Interface = ISecurityStorageOperations;
}
