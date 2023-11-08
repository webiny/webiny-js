import {
    FormBuilderStorageOperationsCreateSystemParams,
    FormBuilderStorageOperationsGetSystemParams,
    FormBuilderStorageOperationsUpdateSystemParams,
    System
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { FormBuilderSystemCreateKeysParams, FormBuilderSystemStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { getClean } from "@webiny/db-dynamodb/utils/get";
import { put } from "@webiny/db-dynamodb";

export interface CreateSystemStorageOperationsParams {
    entity: Entity<any>;
    table: Table<string, string, string>;
}

export const createSystemStorageOperations = (
    params: CreateSystemStorageOperationsParams
): FormBuilderSystemStorageOperations => {
    const { entity } = params;

    const createSystemPartitionKey = ({ tenant }: FormBuilderSystemCreateKeysParams): string => {
        return `T#${tenant}#SYSTEM`;
    };

    const createSystemSortKey = (): string => {
        return "FB";
    };

    const createKeys = (params: FormBuilderSystemCreateKeysParams) => {
        return {
            PK: createSystemPartitionKey(params),
            SK: createSystemSortKey()
        };
    };

    const createSystem = async (
        params: FormBuilderStorageOperationsCreateSystemParams
    ): Promise<System> => {
        const { system } = params;
        const keys = createKeys(system);

        try {
            await put({
                entity,
                item: {
                    ...system,
                    ...keys
                }
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

    const getSystem = async (
        params: FormBuilderStorageOperationsGetSystemParams
    ): Promise<System | null> => {
        const keys = createKeys(params);

        try {
            return await getClean<System>({ entity, keys });
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
        const keys = createKeys(system);

        try {
            await put({
                entity,
                item: {
                    ...system,
                    ...keys
                }
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
        createSystemPartitionKey,
        createSystemSortKey
    };
};
