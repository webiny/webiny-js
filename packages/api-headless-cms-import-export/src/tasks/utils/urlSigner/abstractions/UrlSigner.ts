export interface IUrlSignerSignResult {
    url: string;
    bucket: string;
    key: string;
    expiresOn: Date;
}

export interface IUrlSignerSignParams {
    key: string;
    timeout?: number;
}

export interface IUrlSigner {
    sign(params: IUrlSignerSignParams): Promise<IUrlSignerSignResult>;
}
