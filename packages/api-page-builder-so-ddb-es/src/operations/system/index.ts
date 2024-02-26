import WebinyError from "@webiny/error";
import {
    System,
    SystemStorageOperations,
    SystemStorageOperationsCreateParams,
    SystemStorageOperationsGetParams,
    SystemStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { getClean, put } from "@webiny/db-dynamodb";

interface PartitionKeyParams {
    tenant: string;
}
const createPartitionKey = ({ tenant }: PartitionKeyParams): string => {
    return `T#${tenant}#SYSTEM`;
};

const createSortKey = (): string => {
    return "PB";
};

export interface CreateSystemStorageOperationsParams {
    entity: Entity<any>;
}
export const createSystemStorageOperations = ({
    entity
}: CreateSystemStorageOperationsParams): SystemStorageOperations => {
    const get = async (params: SystemStorageOperationsGetParams): Promise<System | null> => {
        const { tenant } = params;
        const keys = {
            PK: createPartitionKey({ tenant }),
            SK: createSortKey()
        };
        try {
            return await getClean<System>({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load system record.",
                ex.code || "SYSTEM_GET_ERROR",
                {
                    keys
                }
            );
        }
    };

    const create = async (params: SystemStorageOperationsCreateParams): Promise<System> => {
        const { system } = params;
        const keys = {
            PK: createPartitionKey(system),
            SK: createSortKey()
        };
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
                ex.message || "Could not create system record.",
                ex.code || "SYSTEM_CREATE_ERROR",
                {
                    system,
                    keys
                }
            );
        }
    };

    const update = async (params: SystemStorageOperationsUpdateParams): Promise<System> => {
        const { original, system } = params;
        const keys = {
            PK: createPartitionKey(original),
            SK: createSortKey()
        };
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
                ex.message || "Could not update system record.",
                ex.code || "SYSTEM_UPDATE_ERROR",
                {
                    original,
                    system,
                    keys
                }
            );
        }
    };

    return {
        get,
        create,
        update
    };
};
