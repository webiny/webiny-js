import { ScanInput, ScanOutput } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table, ScanOptions } from "~/toolbox";

export interface BaseScanParams {
    options?: ScanOptions;
    params?: Partial<ScanInput>;
}

export interface ScanWithTable extends BaseScanParams {
    table: Table<string, string, string>;
    entity?: never;
}

export interface ScanWithEntity extends BaseScanParams {
    entity: Entity & ScanWithTable;
    table?: never;
}

export type ScanParams = ScanWithTable | ScanWithEntity;

export interface ScanResponse<T> {
    items: T[];
    count?: number;
    scannedCount?: number;
    lastEvaluatedKey?: ScanOutput["LastEvaluatedKey"];
    next?: () => Promise<ScanResponse<T>>;
    requestId: string;
    error: any;
}

interface DdbScanResult<T> {
    Items?: T[];
    Count?: number;
    ScannedCount?: number;
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
        items: result.Items || [],
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
    const { options } = params;

    const table = params.table ? params.table : params.entity.table;

    const result = await table.scan(
        {
            ...options,
            execute: true
        },
        params.params
    );

    return convertResult(result) as ScanResponse<T>;
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
