import type { ScanInput, ScanOutput } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { DynamoDocClient, IScanParams, IScanResponse } from "~/utils/DynamoDocClient.js";
import type { ExecuteWithRetryOptions } from "@webiny/utils";
import { executeWithRetry } from "@webiny/utils";

export type { IScanParams as ScanOptions };
export type { ScanInput, ScanOutput };

export type BaseScanParams = IScanParams;

export interface ScanParams {
    table: DynamoDocClient;
    options?: IScanParams;
}

export type ScanResponse<T = any> = IScanResponse<T>;

export type ScanDbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    TYPE: string;
};

export const scan = async <T>(params: ScanParams): Promise<ScanResponse<T>> => {
    const { table, options } = params;

    const result = await table.scan<T>(options);
    return result;
};

interface ScanWithCallbackOptions {
    retry?: true | ExecuteWithRetryOptions;
}

export const scanWithCallback = async <T>(
    params: ScanParams,
    callback: (result: ScanResponse<ScanDbItem<T>>) => Promise<void | boolean>,
    options?: ScanWithCallbackOptions
): Promise<void> => {
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
