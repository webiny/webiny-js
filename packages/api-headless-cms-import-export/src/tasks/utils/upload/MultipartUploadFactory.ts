import { CreateMultipartUploadCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import {
    ICreateMultipartUploadHandler,
    IMultipartUploadHandler
} from "./abstractions/MultipartUploadHandler";
import {
    IMultipartUploadFactory,
    IMultipartUploadFactoryContinueParams
} from "./abstractions/MultipartUploadFactory";

export interface IMultipartUploadFactoryParams {
    client: S3Client;
    bucket: string;
    filename: string;
    createHandler: ICreateMultipartUploadHandler;
}

export class MultipartUploadFactory implements IMultipartUploadFactory {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly filename: string;
    private readonly createHandler: ICreateMultipartUploadHandler;

    public constructor(params: IMultipartUploadFactoryParams) {
        this.client = params.client;
        this.bucket = params.bucket;
        this.filename = params.filename;
        this.createHandler = params.createHandler;
    }

    public async start(): Promise<IMultipartUploadHandler> {
        const cmd = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: this.filename
        });

        const result = await this.client.send(cmd);
        const uploadId = result.UploadId;
        if (uploadId) {
            return this.createHandler({
                uploadId,
                client: this.client,
                bucket: this.bucket,
                filename: this.filename
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

    public async continue(
        params: IMultipartUploadFactoryContinueParams
    ): Promise<IMultipartUploadHandler> {
        return this.createHandler({
            client: this.client,
            bucket: this.bucket,
            filename: this.filename,
            uploadId: params.uploadId,
            part: params.part,
            tags: params.tags
        });
    }
}
