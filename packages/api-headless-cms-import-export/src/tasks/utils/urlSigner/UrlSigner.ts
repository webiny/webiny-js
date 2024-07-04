import { GetObjectCommand, getSignedUrl, S3Client } from "@webiny/aws-sdk/client-s3";
import { IUrlSigner, IUrlSignerSignParams, IUrlSignerSignResult } from "./abstractions/UrlSigner";

export interface IUrlSignerParams {
    client: S3Client;
    bucket: string;
}

export class UrlSigner implements IUrlSigner {
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: IUrlSignerParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async sign(params: IUrlSignerSignParams): Promise<IUrlSignerSignResult> {
        const timeout = params.timeout || 604800; // 1 week default
        const url = await getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: params.key
            }),
            {
                expiresIn: timeout
            }
        );
        const expiresOn = new Date(new Date().getTime() + timeout);
        return {
            url,
            bucket: this.bucket,
            key: params.key,
            expiresOn
        };
    }
}
