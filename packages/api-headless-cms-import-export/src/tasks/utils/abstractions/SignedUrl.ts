export interface ISignedUrlFetchResult {
    url: string;
    bucket: string;
    key: string;
    expiresOn: Date;
}

export interface ISignedUrlFetchParams {
    key: string;
    timeout?: number;
}

export interface ISignUrl {
    fetch(params: ISignedUrlFetchParams): Promise<ISignedUrlFetchResult>;
}
