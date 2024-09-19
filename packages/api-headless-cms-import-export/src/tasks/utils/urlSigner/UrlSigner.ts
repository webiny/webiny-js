import {
    GetObjectCommand,
    getSignedUrl,
    HeadObjectCommand,
    S3Client
} from "@webiny/aws-sdk/client-s3";
import type {
    IUrlSigner,
    IUrlSignerSignParams,
    IUrlSignerSignResult
} from "./abstractions/UrlSigner";

const DEFAULT_TIMEOUT = 3600; // 1 hour

export interface IUrlSignerParams {
    client: S3Client;
    bucket: string;
}

export interface IObjectCommandConstructor {
    new (params: { Bucket: string; Key: string }): GetObjectCommand | HeadObjectCommand;
}

export class UrlSigner implements IUrlSigner {
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: IUrlSignerParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async get(params: IUrlSignerSignParams): Promise<IUrlSignerSignResult> {
        return this.sign(params, GetObjectCommand);
    }

    public async head(params: IUrlSignerSignParams): Promise<IUrlSignerSignResult> {
        return this.sign(params, HeadObjectCommand);
    }

    private async sign(
        params: IUrlSignerSignParams,
        command: IObjectCommandConstructor
    ): Promise<IUrlSignerSignResult> {
        const expiresIn = params.timeout || DEFAULT_TIMEOUT;
        const expiresOn = new Date(new Date().getTime() + expiresIn * 1000);

        const url = await getSignedUrl(
            this.client,
            new command({
                Bucket: this.bucket,
                Key: params.key
            }),
            {
                expiresIn
            }
        );

        return {
            url,
            bucket: this.bucket,
            key: params.key,
            expiresOn
        };
    }
}
