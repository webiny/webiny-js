export interface IZipCombinerResolveResult {
    next?: string;
    key: string;
    url: string;
    bucket: string;
    expiresOn: Date;
}

export interface IZipCombinerResolveParams {
    source: string;
    isAborted: () => boolean;
    isCloseToTimeout: () => boolean;
}

export interface IZipCombiner {
    resolve(params: IZipCombinerResolveParams): Promise<IZipCombinerResolveResult>;
}
