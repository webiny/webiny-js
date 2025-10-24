import { createAbstraction } from "@webiny/feature/api";
import type { AdminUsersStorageOperations as IAdminUsersStorageOperations } from "~/types.js";

// Legacy storage operations abstraction for DI container
export const AdminUsersStorageOperations = createAbstraction<IAdminUsersStorageOperations>(
    "AdminUsersStorageOperations"
);

export namespace AdminUsersStorageOperations {
    export type Interface = IAdminUsersStorageOperations;
}
