import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import { DeleteObjectCommand, HeadObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";

export interface IDeleteFileParamsGetS3ClientCb {
    (config: Partial<S3ClientConfig>): Pick<S3Client, "send">;
}

export interface IDeleteFileParams {
    region: string;
    createS3Client: IDeleteFileParamsGetS3ClientCb;
    maxRetries?: number;
    baseDelayMs?: number;
}

export interface IDeleteFileInput {
    bucket: string;
    key: string;
}

interface IDeleteFileObjectExistsParams {
    client: Pick<S3Client, "send">;
    bucket: string;
    key: string;
}

export class DeleteFile {
    private readonly region: string;
    private readonly createS3Client: IDeleteFileParamsGetS3ClientCb;
    private readonly maxRetries: number;
    private readonly baseDelayMs: number;

    public constructor(params: IDeleteFileParams) {
        const { createS3Client, region, maxRetries = 5, baseDelayMs = 100 } = params;
        this.region = region;
        this.createS3Client = createS3Client;
        this.maxRetries = maxRetries;
        this.baseDelayMs = baseDelayMs;
    }

    public async delete(params: IDeleteFileInput): Promise<void> {
        const { bucket, key } = params;
        const client = this.createS3Client({
            region: this.region
        });

        if (!(await this.objectExists({ client, bucket, key }))) {
            return;
        }

        await this.withRetry(async () => {
            const cmd = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            });
            return await client.send(cmd);
        });
    }

    private async objectExists(params: IDeleteFileObjectExistsParams): Promise<boolean> {
        const { client, bucket, key } = params;
        try {
            const result = await this.withRetry(async () => {
                const cmd = new HeadObjectCommand({
                    Bucket: bucket,
                    Key: key
                });
                return await client.send(cmd);
            });
            return result.$metadata?.httpStatusCode === 200;
        } catch (ex) {
            if (ex?.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw ex;
        }
    }

    private async withRetry<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            const retryable =
                error?.name === "Throttling" ||
                error?.name === "TooManyRequestsException" ||
                error?.name === "SlowDown";

            if (retryable && attempt < this.maxRetries) {
                const delay = this.baseDelayMs * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.withRetry(operation, attempt + 1);
            }

            throw error;
        }
    }
}
