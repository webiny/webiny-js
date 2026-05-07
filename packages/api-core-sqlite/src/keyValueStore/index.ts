import type { Database } from "@webiny/db-sqlite";
import { KeyValueStoreStorageOperations } from "./KeyValueStoreStorageOperations.js";

export interface CreateKeyValueStoreStorageOperationsParams {
    db: Database;
}

export const createStorageOperations = (
    params: CreateKeyValueStoreStorageOperationsParams
): KeyValueStoreStorageOperations => {
    return new KeyValueStoreStorageOperations(params.db);
};

export { KeyValueStoreStorageOperations };
