import type {
    ICreateS3ClientCb,
    IGetLambdaTriggerCb
} from "~/resolver/recordTypes/fileManager/types.js";
import type { CommandType } from "~/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { ITable } from "~/sync/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { PutCommandOutput } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IBundle } from "~/resolver/app/bundler/types.js";
import type { HeadObjectCommandInput, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { HeadObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";

interface IExistsParams {
    client: S3Client;
    bucket: string;
    key: string;
}

export interface IDeleteFileParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb;
}

export interface IDeleteFileHandleParams {
    command: CommandType;
    item: IStoreItem;
    table: ITable;
    deployment: IDeployment;
    result: PutCommandOutput;
    bundle: IBundle;
}

export class DeleteFile {
    private readonly createS3Client: ICreateS3ClientCb;
    private readonly getLambdaTrigger: IGetLambdaTriggerCb;

    public constructor(params: IDeleteFileParams) {
        this.createS3Client = params.createS3Client;
        this.getLambdaTrigger = params.getLambdaTrigger;
    }

    public async handle(params: IDeleteFileHandleParams): Promise<void> {
        const { item, bundle, deployment } = params;
        /**
         * First we need to figure out the file location.
         */
        if (!item.values) {
            return;
        }
        // @ts-expect-error
        const fileKey = item.values["text@key"] || item.values["key"];
        if (!fileKey || typeof fileKey !== "string") {
            // TODO should we log that there is no file key?
            return;
        }

        /**
         * We need to check on the target if the file already exists.
         */

        const targetClient = this.createS3Client({
            region: deployment.region
        });

        const exists = await this.exists({
            client: targetClient,
            bucket: deployment.services.s3Id,
            key: fileKey
        });
        if (!exists) {
            // If the file does not exist, we can skip the deletion.
            return;
        }

        /**
         * Then we can safely trigger a Lambda function that will delete the file.
         */
        await this.getLambdaTrigger().handle({
            invocationType: "Event",
            payload: {
                action: "delete",
                key: fileKey,
                source: {
                    region: bundle.source.region,
                    bucket: bundle.source.services.s3Id
                },
                target: {
                    region: deployment.region,
                    bucket: deployment.services.s3Id
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
