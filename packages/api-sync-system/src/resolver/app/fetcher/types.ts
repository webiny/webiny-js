import type { IDeployment } from "~/resolver/deployment/types.js";
import type { ITable } from "~/sync/types.js";
import type { ISourceDataContainer } from "~/resolver/app/data/types.js";

export interface IFetcherExecParamsItem {
    PK: string;
    SK: string;
}

export interface IFetcherExecParams {
    maxBatchSize?: number;
    deployment: IDeployment;
    table: ITable;
    items: IFetcherExecParamsItem[];
}

export interface IFetcherExecValidResult {
    error?: never;
    items: ISourceDataContainer;
}

export interface IFetcherExecErrorResult {
    error: Error;
    items?: never;
}

export type IFetcherExecResult = IFetcherExecValidResult | IFetcherExecErrorResult;

export interface IFetcher {
    exec(params: IFetcherExecParams): Promise<IFetcherExecResult>;
}
