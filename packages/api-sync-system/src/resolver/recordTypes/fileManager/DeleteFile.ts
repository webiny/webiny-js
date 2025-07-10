import type {
    ICreateS3ClientCb,
    IDeleteFile,
    IDeleteFileHandleParams,
    IGetLambdaTriggerCb
} from "~/resolver/recordTypes/fileManager/types.js";
import type { HeadObjectCommandInput, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { HeadObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";
import type { IDeleteFileLambdaPayload } from "~/types.js";

interface IExistsParams {
    client: Pick<S3Client, "send">;
    bucket: string;
    key: string;
}

export interface IDeleteFileParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb<IDeleteFileLambdaPayload>;
}

export class DeleteFile implements IDeleteFile {
    private readonly createS3Client: ICreateS3ClientCb;
    private readonly getLambdaTrigger: IGetLambdaTriggerCb<IDeleteFileLambdaPayload>;

    public constructor(params: IDeleteFileParams) {
        this.createS3Client = params.createS3Client;
        this.getLambdaTrigger = params.getLambdaTrigger;
    }

    public async handle(params: IDeleteFileHandleParams): Promise<InvokeCommandOutput | null> {
        const { key, target } = params;

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
        if (!exists) {
            // If the file does not exist, we can skip the deletion.
            return null;
        }

        /**
         * Then we can safely trigger a Lambda function that will delete the file.
         */
        return await this.getLambdaTrigger().handle({
            invocationType: "Event",
            payload: {
                action: "deleteFile",
                key,
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
            return result.$metadata?.httpStatusCode === 200;
        } catch {
            return false;
        }
    }
}
