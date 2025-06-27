import { CommandType } from "~/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { ITable } from "~/sync/types.js";
import type { PutCommandOutput } from "@webiny/aws-sdk/client-dynamodb";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import type { IBundle } from "~/resolver/app/bundler/types.js";

export interface ICopyFileHandleParams {
    command: CommandType;
    item: IStoreItem;
    table: ITable;
    result: PutCommandOutput;
    bundle: IBundle;
}

export class CopyFile {
    public constructor() {
        // not needed
    }

    public async handle(params: ICopyFileHandleParams): Promise<void> {
        const { command, item, result, bundle } = params;
        /**
         * First we need to figure out the file location.
         */
        if (!item.values) {
            return;
        }
        // @ts-expect-error
        const fileKey = item.values["text@key"] || item.values["key"];
        if (!fileKey) {
            // TODO should we log that there is no file key?
            return;
        }
        /**
         * We need to check on the target if the file already exists.
         */
        const targetClient = createS3Client({
            region: bundle.source.region
        });
    }
}
