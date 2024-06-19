export interface ISignedUrlFetchResult {
    url: string;
    bucket: string;
    key: string;
}

export interface ISignedUrlFetchParams {
    key: string;
    timeout?: number;
}

export interface ISignedUrl {
    fetch(params: ISignedUrlFetchParams): Promise<ISignedUrlFetchResult>;
}
