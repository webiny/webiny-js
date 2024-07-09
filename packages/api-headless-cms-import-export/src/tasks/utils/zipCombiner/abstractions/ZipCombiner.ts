import { IIsCloseToTimeoutCallable } from "@webiny/tasks";

export interface IZipCombinerResolveResult {
    lastFileProcessed?: string;
    key: string;
    url: string;
    bucket: string;
    expiresOn: Date;
}

export interface IZipCombinerResolveParams {
    source: string;
    modelId: string;
    lastFileProcessed: string | undefined;
    isAborted: () => boolean;
    isCloseToTimeout: IIsCloseToTimeoutCallable;
}

export interface IZipCombiner {
    resolve(params: IZipCombinerResolveParams): Promise<IZipCombinerResolveResult>;
}
