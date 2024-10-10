import type { Options as BaseUploadOptions } from "@webiny/aws-sdk/lib-storage";
import { Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";
import type { Transform } from "stream";
import { PassThrough } from "stream";
import type {
    CompleteMultipartUploadCommandOutput,
    PutObjectCommandInput,
    S3Client
} from "@webiny/aws-sdk/client-s3";
import { IAwsUpload, IUpload, IUploadOnListener } from "./abstractions/Upload";
import { getContentType } from "./getContentType";

export interface IUploadConfig {
    client: S3Client;
    stream: PassThrough;
    bucket: string;
    filename: string;
    factory?(params: BaseUploadOptions): IAwsUpload;
    queueSize?: number;
}

const defaultFactory = (options: BaseUploadOptions): IAwsUpload => {
    return new BaseUpload(options);
};

export class Upload implements IUpload {
    public readonly stream: PassThrough;
    public readonly upload: IAwsUpload;
    public readonly client: S3Client;

    public constructor(input: IUploadConfig) {
        this.client = input.client;
        const factory = input?.factory || defaultFactory;

        const params: PutObjectCommandInput = {
            ACL: "private",
            Body: input.stream,
            Bucket: input.bucket,
            ContentType: getContentType(input.filename),
            Key: input.filename
        };

        this.upload = factory({
            client: input.client,
            params,
            queueSize: input.queueSize || 1,
            partSize: 1024 * 1024 * 5,
            leavePartsOnError: false
        });
        this.stream = input.stream;
    }

    public async abort(): Promise<void> {
        await this.upload.abort();
    }

    public async done(): Promise<CompleteMultipartUploadCommandOutput> {
        try {
            return await this.upload.done();
        } catch (ex) {
            await this.abort();
            throw ex;
        }
    }

    public onProgress(listener: IUploadOnListener): void {
        this.upload.on("httpUploadProgress", listener);
    }
}

export interface ICreateUploadFactoryParams {
    client: S3Client;
    bucket: string;
}

export interface ICreateUploadCallable {
    (filename: string, options?: ICreateUploadFactoryOptions): IUpload;
}

export interface ICreateUploadFactoryOptions {
    stream?: Transform;
    client?: S3Client;
    bucket?: string;
}

export const createUploadFactory = (params: ICreateUploadFactoryParams): ICreateUploadCallable => {
    return (filename, options) => {
        const stream =
            options?.stream ||
            new PassThrough({
                autoDestroy: true
            });

        if (stream.listenerCount("error") === 0) {
            stream.on("error", ex => {
                console.log("Upload Stream Error", ex);
                throw ex;
            });
        }

        return new Upload({
            client: options?.client || params.client,
            bucket: options?.bucket || params.bucket,
            stream,
            filename
        });
    };
};
