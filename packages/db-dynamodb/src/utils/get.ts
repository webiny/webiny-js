import { Entity } from "~/toolbox";
import { cleanupItem } from "~/utils/cleanup";

export interface GetRecordParams {
    entity: Entity;
    keys: {
        PK: string;
        SK: string;
    };
}

/**
 * Gets a single record from the DynamoDB table.
 * Returns either record or null.
 *
 * Be aware to wrap in try/catch to avoid the error killing your app.
 *
 * @throws
 */
export const get = async <T>(params: GetRecordParams): Promise<T | null> => {
    const { entity, keys } = params;

    const result = await entity.get(keys, {
        execute: true
    });

    if (!result?.Item) {
        return null;
    }
    return result.Item as T;
};

export const getClean = async <T>(params: GetRecordParams): Promise<T | null> => {
    const result = await get<T>(params);
    if (!result) {
        return null;
    }
    return cleanupItem<T>(params.entity, result);
};
