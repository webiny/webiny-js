import type { HeadObjectCommandInput, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { HeadObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import type {
    ICopyFile,
    ICopyFileHandleParams,
    ICreateS3ClientCb,
    IGetLambdaTriggerCb
} from "./types.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";
import type { ICopyFileLambdaPayload } from "~/types.js";

interface IExistsParams {
    client: Pick<S3Client, "send">;
    bucket: string;
    key: string;
}

export interface ICopyFileParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb<ICopyFileLambdaPayload>;
}

export class CopyFile implements ICopyFile {
    private readonly createS3Client: ICreateS3ClientCb;
    private readonly getLambdaTrigger: IGetLambdaTriggerCb<ICopyFileLambdaPayload>;

    public constructor(params: ICopyFileParams) {
        this.createS3Client = params.createS3Client;
        this.getLambdaTrigger = params.getLambdaTrigger;
    }

    public async handle(params: ICopyFileHandleParams): Promise<InvokeCommandOutput | null> {
        const { key, source, target } = params;
        /**
         * We need to check on the target if the file already exists.
         */
        const targetClient = this.createS3Client({
            region: target.region
        });

        const exists = await this.exists({
            client: targetClient,
            bucket: target.services.s3Id,
            key
        });

        if (exists) {
            // If the file already exists, we can skip copying it.
            return null;
        }

        /**
         * Then we can safely trigger a Lambda function that will copy the file.
         */

        return await this.getLambdaTrigger().handle({
            invocationType: "Event",
            payload: {
                action: "copyFile",
                key,
                source: {
                    region: source.region,
                    bucket: source.services.s3Id
                },
                target: {
                    region: target.region,
                    bucket: target.services.s3Id
                }
            }
        });
    }

    private async exists(params: IExistsParams): Promise<boolean> {
        const { client, bucket, key } = params;
        const input: HeadObjectCommandInput = {
            Bucket: bucket,
            Key: key
        };
        const cmd = new HeadObjectCommand(input);
        try {
            const result = await client.send(cmd);
            return result.$metadata?.httpStatusCode === 200 && !!result.ETag;
        } catch (ex) {
            /**
             * TODO What happens if this fails? To we continue with the copy or end the process?
             * Do we log the error?
             * For now, we will assume that file does not exist.
             */
            return false;
        }
    }
}
