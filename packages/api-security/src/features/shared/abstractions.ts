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

/**
 * GetTenant abstraction
 * Function that returns the current tenant ID
 */
export interface IGetTenant {
    (): string | undefined;
}

export const GetTenant = createAbstraction<IGetTenant>("GetTenant");

export namespace GetTenant {
    export type Interface = IGetTenant;
}
