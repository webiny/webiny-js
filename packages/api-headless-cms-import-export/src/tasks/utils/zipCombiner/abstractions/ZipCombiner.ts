export interface IZipCombinerResolveResult {
    lastFileProcessed?: string;
    key: string;
    url: string;
    bucket: string;
    expiresOn: Date;
}

export interface IZipCombinerResolveParams {
    source: string;
    lastFileProcessed: string | undefined;
    isAborted: () => boolean;
    isCloseToTimeout: () => boolean;
}

export interface IZipCombiner {
    resolve(params: IZipCombinerResolveParams): Promise<IZipCombinerResolveResult>;
}
