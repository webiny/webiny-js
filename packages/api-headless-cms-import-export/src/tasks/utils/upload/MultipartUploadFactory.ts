import { CreateMultipartUploadCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import { ICreateMultipartUpload, IMultipartUpload } from "./abstractions/MultipartUpload";
import {
    IMultipartUploadFactory,
    IMultipartUploadFactoryContinueParams
} from "./abstractions/MultipartUploadFactory";

export interface IMultipartUploadFactoryParams {
    client: S3Client;
    bucket: string;
    filename: string;
    createUpload: ICreateMultipartUpload;
}

export class MultipartUploadFactory implements IMultipartUploadFactory {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly filename: string;
    private readonly createUpload: ICreateMultipartUpload;

    public constructor(params: IMultipartUploadFactoryParams) {
        this.client = params.client;
        this.bucket = params.bucket;
        this.filename = params.filename;
        this.createUpload = params.createUpload;
    }

    public async start(): Promise<IMultipartUpload> {
        const cmd = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: this.filename
        });

        const result = await this.client.send(cmd);
        const uploadId = result.UploadId;
        if (uploadId) {
            return this.createUpload({
                uploadId,
                client: this.client,
                bucket: this.bucket,
                filename: this.filename,
                part: 0
            });
        }
        throw new WebinyError({
            message: "Could not initiate multipart upload.",
            code: "S3_ERROR",
            data: {
                bucket: this.bucket,
                filename: this.filename
            }
        });
    }

    public continue(params: IMultipartUploadFactoryContinueParams): IMultipartUpload {
        return this.createUpload({
            client: this.client,
            bucket: this.bucket,
            filename: this.filename,
            uploadId: params.uploadId,
            part: params.part
        });
    }
}
