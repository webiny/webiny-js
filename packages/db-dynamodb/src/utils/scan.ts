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

const convertResult = <T>(result: any): ScanResponse<T> => {
    return {
        items: result.Items as T[],
        count: result.Count,
        scannedCount: result.ScannedCount,
        lastEvaluatedKey: result.LastEvaluatedKey,
        next: result.LastEvaluatedKey ? result.next : undefined,
        error: result.error,
        requestId: result.$response.requestId
    };
};

export const scan = async <T>(params: ScanParams): Promise<ScanResponse<T>> => {
    const { entity, options } = params;

    const result = await entity.table.scan(options, params.params);

    return convertResult(result);
};

export const scanWithCallback = async <T>(
    params: ScanParams,
    callback: (result: ScanResponse<T>) => Promise<void>
): Promise<void> => {
    let result = await scan<T>(params);
    if (!result?.items?.length) {
        return;
    }
    await callback(result);

    while (result.next) {
        result = convertResult(await result.next());
        await callback(result);
        if (!result.next) {
            return;
        }
    }
};
