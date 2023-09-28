import { ScanInput, ScanOutput } from "@webiny/aws-sdk/client-dynamodb";
import { scanOptions as DynamoDBToolboxScanOptions } from "dynamodb-toolbox/dist/classes/Table";
import { Entity } from "dynamodb-toolbox";

export interface ScanParams {
    entity: Entity<any>;
    options: DynamoDBToolboxScanOptions;
    params?: Partial<ScanInput>;
}

export interface ScanResponse<T> {
    items: T[];
    count: number;
    scannedCount: number;
    lastEvaluatedKey?: ScanOutput["LastEvaluatedKey"];
    next?: () => Promise<ScanResponse<T>>;
    requestId: string;
    error: any;
}

interface DdbScanResult<T> {
    Items: T[];
    Count: number;
    ScannedCount: number;
    LastEvaluatedKey?: ScanOutput["LastEvaluatedKey"];
    next?: () => Promise<DdbScanResult<T>>;
    error?: any;
    $response?: {
        requestId: string;
    };
}

type NextCb<T> = () => Promise<ScanResponse<T>>;

const createNext = <T>(result: DdbScanResult<T>): NextCb<T> | undefined => {
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
        lastEvaluatedKey: result.LastEvaluatedKey || undefined,
        next: createNext<T>(result),
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
