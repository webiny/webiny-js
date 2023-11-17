import {
    CmsSystem,
    CmsSystemStorageOperations,
    CmsSystemStorageOperationsCreateParams,
    CmsSystemStorageOperationsGetParams,
    CmsSystemStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import WebinyError from "@webiny/error";
import { getClean } from "@webiny/db-dynamodb/utils/get";
import { put } from "@webiny/db-dynamodb";

interface CreateSystemStorageOperationsParams {
    entity: Entity<any>;
}

interface PartitionKeyParams {
    tenant: string;
}
const createPartitionKey = ({ tenant }: PartitionKeyParams): string => {
    return `T#${tenant.toLowerCase()}#SYSTEM`;
};
const createSortKey = (): string => {
    return "CMS";
};

interface Keys {
    PK: string;
    SK: string;
}
const createKeys = (params: PartitionKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKey()
    };
};

export const createSystemStorageOperations = (
    params: CreateSystemStorageOperationsParams
): CmsSystemStorageOperations => {
    const { entity } = params;

    const create = async ({ system }: CmsSystemStorageOperationsCreateParams) => {
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
                ex.message || "Could not create system.",
                ex.code || "CREATE_SYSTEM_ERROR",
                {
                    error: ex,
                    system,
                    keys
                }
            );
        }
    };

    const update = async (params: CmsSystemStorageOperationsUpdateParams) => {
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
                ex.message || "Could not update system.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                {
                    error: ex,
                    system,
                    keys
                }
            );
        }
    };

    const get = async (params: CmsSystemStorageOperationsGetParams) => {
        const keys = createKeys(params);

        try {
            return await getClean<CmsSystem>({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get system.",
                ex.code || "GET_SYSTEM_ERROR",
                {
                    error: ex,
                    keys
                }
            );
        }
    };

    return {
        create,
        update,
        get
    };
};
