import {
    FormBuilderStorageOperationsCreateSystemParams,
    FormBuilderStorageOperationsUpdateSystemParams,
    System
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { FormBuilderSystemStorageOperations } from "~/types";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";

export interface Params {
    entity: Entity<any>;
    table: Table;
    tenant: Tenant;
}

export const createSystemStorageOperations = (
    params: Params
): FormBuilderSystemStorageOperations => {
    const { entity, tenant } = params;

    const createPartitionKey = (): string => {
        return `T#${tenant.id}#SYSTEM`;
    };

    const createSortKey = (): string => {
        return "FB";
    };

    const createKeys = () => {
        return {
            PK: createPartitionKey(),
            SK: createSortKey()
        };
    };

    const createSystem = async (
        params: FormBuilderStorageOperationsCreateSystemParams
    ): Promise<System> => {
        const { system } = params;
        const keys = createKeys();

        try {
            await entity.put({
                ...system,
                ...keys
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create the system record by given keys.",
                ex.code || "CREATE_SYSTEM_ERROR",
                {
                    keys,
                    system
                }
            );
        }
    };

    const getSystem = async (): Promise<System> => {
        const keys = createKeys();

        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get the system record by given keys.",
                ex.code || "LOAD_SYSTEM_ERROR",
                {
                    keys
                }
            );
        }
    };

    const updateSystem = async (
        params: FormBuilderStorageOperationsUpdateSystemParams
    ): Promise<System> => {
        const { system, original } = params;
        const keys = createKeys();

        try {
            await entity.put({
                ...system,
                ...keys
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update the system record by given keys.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                {
                    keys,
                    original,
                    system
                }
            );
        }
    };

    return {
        createSystem,
        getSystem,
        updateSystem,
        createPartitionKey,
        createSortKey
    };
};
