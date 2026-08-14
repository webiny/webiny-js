import type { Entity } from "~/toolbox.js";
import { cleanupItem } from "~/utils/cleanup.js";

export interface GetRecordParamsKeys {
    PK: string;
    SK: string;
}

export interface GetRecordOptions {
    /** Read with strong consistency (DynamoDB `ConsistentRead`) instead of the eventual default. */
    consistent?: boolean;
}

export interface GetRecordParams {
    entity: Entity;
    keys: GetRecordParamsKeys;
    options?: GetRecordOptions;
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
    const { entity, keys, options } = params;

    const result = await entity.get(keys, {
        execute: true,
        consistent: options?.consistent
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
