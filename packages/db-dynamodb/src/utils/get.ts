import { Entity } from "dynamodb-toolbox";

export interface GetRecordParams {
    entity: Entity<any>;
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

    const result = await entity.get(keys);

    if (!result || !result.Item) {
        return null;
    }
    return result.Item;
};
