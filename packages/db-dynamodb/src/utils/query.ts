import type {
    DynamoDocClient,
    IQueryParams as IClientQueryParams
} from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { EntityQueryOptions } from "~/toolbox.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface QueryAllParams {
    client: DynamoDocClient;
    schema: EntitySchema;
    partitionKey: string;
    options?: EntityQueryOptions;
}

export interface QueryOneParams extends QueryAllParams {
    options?: Omit<EntityQueryOptions, "limit">;
}

export const queryOne = async <T>(params: QueryOneParams): Promise<T | null> => {
    const { client, partitionKey, options } = params;

    const result = await client.queryOne<T>(toClientParams(partitionKey, options));
    return result;
};

export const queryOneClean = async <T>(params: QueryOneParams): Promise<T | null> => {
    const result = await queryOne(params);
    if (!result) {
        return null;
    }
    return params.schema.unmarshal<T>(result as GenericRecord);
};

export const queryAll = async <T>(params: QueryAllParams): Promise<T[]> => {
    const { client, partitionKey, options } = params;

    const result = await client.query<T>(toClientParams(partitionKey, options));
    return result;
};

export const queryAllClean = async <T>(params: QueryAllParams): Promise<T[]> => {
    const results = await queryAll<T>(params);
    return results.map(item => params.schema.unmarshal<T>(item as GenericRecord));
};

export interface IQueryPageResponse<T> {
    items: T[];
    lastEvaluatedKey: GenericRecord;
}

export const queryPerPage = async <T>(params: QueryAllParams): Promise<IQueryPageResponse<T>> => {
    const { client, partitionKey, options } = params;

    const result = await client.queryPage<T>(
        toClientParams(partitionKey, {
            ...options,
            limit: options?.limit || 50
        })
    );

    return {
        items: result.items,
        lastEvaluatedKey: result.lastEvaluatedKey as GenericRecord
    };
};

export const queryPerPageClean = async <T>(
    params: QueryAllParams
): Promise<IQueryPageResponse<T>> => {
    const result = await queryPerPage<T>(params);
    return {
        items: result.items.map(item => params.schema.unmarshal<T>(item as GenericRecord)),
        lastEvaluatedKey: result.lastEvaluatedKey
    };
};

export const queryAllWithCallback = async <T>(
    params: QueryAllParams,
    callback: (items: T[]) => Promise<void>
): Promise<void> => {
    const { client, partitionKey, options } = params;

    let startKey: GenericRecord | undefined;

    do {
        const result = await client.queryPage<T>(
            toClientParams(partitionKey, {
                ...options,
                startKey: startKey || options?.startKey
            })
        );

        if (result.items.length > 0) {
            await callback(result.items);
        }

        startKey = result.lastEvaluatedKey;
    } while (startKey);
};

const toClientParams = (partitionKey: string, options?: EntityQueryOptions): IClientQueryParams => {
    return {
        partitionKey,
        index: options?.index,
        limit: options?.limit,
        reverse: options?.reverse,
        consistent: options?.consistent,
        beginsWith: options?.beginsWith,
        eq: options?.eq,
        lt: options?.lt,
        lte: options?.lte,
        gt: options?.gt,
        gte: options?.gte,
        between: options?.between as [string, string] | [number, number] | undefined,
        startKey: options?.startKey as GenericRecord | undefined,
        attributes: options?.attributes
    };
};
