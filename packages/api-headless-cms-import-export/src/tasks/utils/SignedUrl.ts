import { GetObjectCommand, getSignedUrl, S3Client } from "@webiny/aws-sdk/client-s3";
import { ISignedUrl, ISignedUrlFetchParams, ISignedUrlFetchResult } from "./abstractions/SignedUrl";

export interface ISignedUrlParams {
    client: S3Client;
    bucket: string;
}

export class SignedUrl implements ISignedUrl {
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: ISignedUrlParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async fetch(params: ISignedUrlFetchParams): Promise<ISignedUrlFetchResult> {
        const url = await getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: params.key
            }),
            {
                expiresIn: params.timeout || 604800 // 1 week default
            }
        );
        return {
            url,
            bucket: this.bucket,
            key: params.key
        };
    }
}
