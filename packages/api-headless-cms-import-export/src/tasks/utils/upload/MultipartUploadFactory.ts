import type { ListPartsCommandOutput, S3Client } from "@webiny/aws-sdk/client-s3";
import { CreateMultipartUploadCommand, ListPartsCommand } from "@webiny/aws-sdk/client-s3";
import { WebinyError } from "@webiny/error";
import {
    ICreateMultipartUploadHandler,
    IMultipartUploadHandler,
    IPart
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

    public async start(
        params?: IMultipartUploadFactoryContinueParams
    ): Promise<IMultipartUploadHandler> {
        const resumeUploadId = params?.uploadId;
        if (resumeUploadId !== undefined) {
            return this.continue({
                uploadId: resumeUploadId
            });
        }
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
                filename: this.filename,
                parts: undefined
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

    private async continue(
        params: Required<IMultipartUploadFactoryContinueParams>
    ): Promise<IMultipartUploadHandler> {
        const result = await this.listParts({
            uploadId: params.uploadId
        });

        const parts = result.Parts.map<IPart | null>(part => {
            if (!part.ETag || part.PartNumber === undefined) {
                return null;
            }
            return {
                tag: part.ETag.replaceAll('"', ""),
                partNumber: part.PartNumber
            };
        })
            .filter((part): part is IPart => !!part)
            .sort((a, b) => {
                return a.partNumber - b.partNumber;
            });
        return this.createHandler({
            client: this.client,
            bucket: this.bucket,
            filename: this.filename,
            uploadId: params.uploadId,
            parts
        });
    }

    private async listParts(
        params: Required<IMultipartUploadFactoryContinueParams>
    ): Promise<Required<ListPartsCommandOutput>> {
        const cmd = new ListPartsCommand({
            Bucket: this.bucket,
            Key: this.filename,
            UploadId: params.uploadId
        });

        let result: ListPartsCommandOutput;
        try {
            result = await this.client.send(cmd);
        } catch (ex) {
            throw new WebinyError({
                message: `Failed to list parts: ${ex.message}`,
                code: "S3_ERROR",
                data: {
                    metadata: ex.$metadata,
                    bucket: this.bucket,
                    filename: this.filename,
                    uploadId: params.uploadId
                }
            });
        }

        if (!result.UploadId || !result.Parts?.length) {
            throw new WebinyError({
                message: "Could not find the upload.",
                code: "S3_ERROR",
                data: {
                    bucket: this.bucket,
                    filename: this.filename,
                    uploadId: params.uploadId
                }
            });
        }
        return result as Required<ListPartsCommandOutput>;
    }
}

export interface ICreateMultipartUploadFactoryCallable {
    (params: IMultipartUploadFactoryParams): IMultipartUploadFactory;
}

export const createMultipartUploadFactory: ICreateMultipartUploadFactoryCallable = params => {
    return new MultipartUploadFactory(params);
};
