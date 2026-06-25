import { createAbstraction } from "@webiny/feature/api";
import type {
    TenancyStorageOperations as ITenancyStorageOperations,
    Tenant as ITenant,
    ListTenantsParams as IListTenantsParams
} from "~/types/tenancy.js";

/**
 * Abstraction for Tenancy Storage Operations
 * This allows the legacy storage operations to be injected through DI
 */
export const TenancyStorageOperations = createAbstraction<ITenancyStorageOperations>(
    "TenancyStorageOperations"
);

export namespace TenancyStorageOperations {
    export type Interface = ITenancyStorageOperations;
    export type Tenant = ITenant;
    export type ListTenantsParams = IListTenantsParams;
}
