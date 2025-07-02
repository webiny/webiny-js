import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "./shouldBeHandled.js";
import type { PutCommandOutput } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { CopyFile } from "./CopyFile.js";
import { convertException } from "@webiny/utils";
import type { ICreateS3ClientCb, IGetLambdaTriggerCb } from "./types.js";

export interface ICreateFileManagerOnPutPluginParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb;
}

export const createFileManagerOnPutPlugin = (params: ICreateFileManagerOnPutPluginParams) => {
    const copyFile = new CopyFile(params);
    return createStorerAfterEachPluginWithName<PutCommandOutput>("fileManager.onPut", {
        canHandle: params => {
            const { command } = params;
            if (command !== "put") {
                return false;
            }
            return shouldBeHandled(params);
        },
        handle: async params => {
            try {
                return await copyFile.handle({
                    item: params.item,
                    command: params.command,
                    /**
                     * We can safely cast here because we are 100% positive that result is of type PutCommandOutput.
                     */
                    result: params.result as PutCommandOutput,
                    table: params.table,
                    deployment: params.deployment,
                    bundle: params.bundle
                });
            } catch (ex) {
                console.error("Error while handling file manager onPut plugin.");
                console.log(convertException(ex));
            }
        }
    });
};
