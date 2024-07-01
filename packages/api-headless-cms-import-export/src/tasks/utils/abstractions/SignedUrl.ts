export interface ISignUrlFetchResult {
    url: string;
    bucket: string;
    key: string;
    expiresOn: Date;
}

export interface ISignUrlFetchParams {
    key: string;
    timeout?: number;
}

export interface ISignUrl {
    fetch(params: ISignUrlFetchParams): Promise<ISignUrlFetchResult>;
}
