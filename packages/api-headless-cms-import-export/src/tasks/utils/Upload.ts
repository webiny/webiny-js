import { Options as BaseUploadOptions, Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";
import { PassThrough } from "stream";
import type { CompleteMultipartUploadCommandOutput, S3Client } from "@webiny/aws-sdk/client-s3";
import { IAwsUpload, IUpload } from "./abstractions/Upload";

export interface IUploadConfig {
    client: S3Client;
    stream: PassThrough;
    bucket: string;
    filename: string;
    factory?(params: BaseUploadOptions): IAwsUpload;
}

const defaultFactory = (options: BaseUploadOptions) => {
    return new BaseUpload(options);
};

export class Upload implements IUpload {
    public readonly stream: PassThrough;
    public readonly upload: IAwsUpload;
    private readonly client: S3Client;

    public constructor(params: IUploadConfig) {
        this.client = params.client;

        const factory = params?.factory || defaultFactory;

        this.upload = factory({
            client: params.client,
            params: {
                ACL: "private",
                Body: params.stream,
                Bucket: params.bucket,
                ContentType: "application/zip",
                Key: params.filename
            },
            queueSize: 1,
            partSize: 1024 * 1024 * 5,
            leavePartsOnError: false
        });
        this.stream = params.stream;
    }

    public async done(): Promise<CompleteMultipartUploadCommandOutput> {
        const result = await this.upload.done();
        this.client.destroy();
        return result;
    }
}
