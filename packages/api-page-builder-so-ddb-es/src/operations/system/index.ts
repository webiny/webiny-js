import WebinyError from "@webiny/error";
import {
    System,
    SystemStorageOperations,
    SystemStorageOperationsCreateParams,
    SystemStorageOperationsGetParams,
    SystemStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { Entity } from "dynamodb-toolbox";
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
            const result = (await entity.get(keys)) as any;
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
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
            await entity.put({
                ...system,
                ...keys
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
            await entity.put({
                ...system,
                ...keys
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
