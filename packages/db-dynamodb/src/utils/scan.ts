import DocumentClient from "aws-sdk/clients/dynamodb";
import { scanOptions as DynamoDBToolboxScanOptions } from "dynamodb-toolbox/dist/classes/Table";
import { Entity } from "dynamodb-toolbox";

export interface ScanParams {
    entity: Entity<any>;
    options: DynamoDBToolboxScanOptions;
    params?: Partial<DocumentClient.ScanInput>;
}

export interface ScanResponse<T> {
    items: T[];
    count: number;
    scannedCount: number;
    lastEvaluatedKey?: DocumentClient.Key;
    next?: () => Promise<ScanResponse<T>>;
    requestId: string;
    error: any;
}

interface DdbScanResult<T> {
    Items: T[];
    Count: number;
    ScannedCount: number;
    LastEvaluatedKey?: DocumentClient.Key;
    next?: () => Promise<DdbScanResult<T>>;
    error?: any;
    $response?: {
        requestId: string;
    };
}

const createNext = <T>(result: DdbScanResult<T>) => {
    if (!result?.LastEvaluatedKey || !result.next) {
        return undefined;
    }
    return async () => {
        const response = await result!.next!();
        return convertResult(response);
    };
};

const convertResult = <T>(result: DdbScanResult<T>): ScanResponse<T> => {
    return {
        items: result.Items,
        count: result.Count,
        scannedCount: result.ScannedCount,
        lastEvaluatedKey: result.LastEvaluatedKey,
        next: result.LastEvaluatedKey ? createNext<T>(result) : undefined,
        error: result.error,
        requestId: result.$response?.requestId || ""
    };
};

export type ScanDbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
};

export const scan = async <T>(params: ScanParams): Promise<ScanResponse<T>> => {
    const { entity, options } = params;

    const result = await entity.table.scan(options, params.params);

    return convertResult(result);
};

export const scanWithCallback = async <T>(
    params: ScanParams,
    callback: (result: ScanResponse<ScanDbItem<T>>) => Promise<void>
): Promise<void> => {
    let result = await scan<ScanDbItem<T>>(params);
    if (!result.items?.length && !result.lastEvaluatedKey) {
        return;
    }
    await callback(result);

    while (result.next) {
        result = await result.next();
        await callback(result);
        if (!result.next) {
            return;
        }
    }
};
