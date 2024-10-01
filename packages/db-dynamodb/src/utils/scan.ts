import { ScanInput, ScanOutput } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, ScanOptions, Table } from "~/toolbox";
import { executeWithRetry, ExecuteWithRetryOptions } from "@webiny/utils";

export type { ScanOptions };

export interface BaseScanParams {
    options?: ScanOptions;
    params?: Partial<ScanInput>;
}

export interface ScanWithTable extends BaseScanParams {
    table: Table<any, any, any>;
    entity?: never;
}

export interface ScanWithEntity extends BaseScanParams {
    entity: Entity;
    table?: never;
}

export type ScanParams = ScanWithTable | ScanWithEntity;

export interface ScanResponse<T = any> {
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
    TYPE: string;
};

export const scan = async <T>(params: ScanParams): Promise<ScanResponse<T>> => {
    const { options } = params;

    const table = params.table ? params.table : params.entity.table;
    if (!table) {
        throw new Error(`Missing table for scan: ${JSON.stringify(options)}`);
    }

    const result = await table.scan(
        {
            ...options,
            execute: true
        },
        params.params
    );

    return convertResult(result) as ScanResponse<T>;
};

interface ScanWithCallbackOptions {
    retry?: true | ExecuteWithRetryOptions;
}

export const scanWithCallback = async <T>(
    params: ScanParams,
    callback: (result: ScanResponse<ScanDbItem<T>>) => Promise<void | boolean>,
    options?: ScanWithCallbackOptions
): Promise<void> => {
    // For backwards compatibility, we still allow for executing the scan without retries.
    const usingRetry = Boolean(options?.retry);
    const retryOptions = options?.retry === true ? {} : options?.retry;

    const executeScan = () => scan<ScanDbItem<T>>(params);
    const getInitialResult = () => {
        if (usingRetry) {
            return executeWithRetry(executeScan, retryOptions);
        }
        return executeScan();
    };

    let result = await getInitialResult();

    if (!result.items?.length && !result.lastEvaluatedKey) {
        return;
    }

    // If the result of the callback was `false`, that means the
    // user's intention was to stop further table scanning.
    const callbackResult = await callback(result);
    const mustBreak = callbackResult === false;
    if (mustBreak) {
        return;
    }

    while (result.next) {
        const executeNext = () => result.next!();
        const getNextResult = () => {
            if (usingRetry) {
                return executeWithRetry(executeNext, retryOptions);
            }
            return executeNext();
        };

        result = await getNextResult();

        // If the result of the callback was `false`, that means the
        // user's intention was to stop further table scanning.
        const callbackResult = await callback(result);
        const mustBreak = callbackResult === false;
        if (mustBreak) {
            break;
        }

        if (!result.next) {
            return;
        }
    }
};
