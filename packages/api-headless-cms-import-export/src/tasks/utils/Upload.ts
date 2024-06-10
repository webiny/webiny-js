import { Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";
import { PassThrough } from "stream";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { IS3Client } from "./abstractions/S3Client";
import { IUpload } from "./abstractions/Upload";

export interface IUploadConfig {
    client: IS3Client;
    stream: PassThrough;
    bucket: string;
    filename: string;
}

export class Upload implements IUpload {
    public readonly stream: PassThrough;
    private readonly upload: Pick<BaseUpload, "done">;
    private readonly client: IS3Client;

    public constructor(params: IUploadConfig) {
        this.client = params.client;
        this.upload = new BaseUpload({
            client: this.client.client,
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
