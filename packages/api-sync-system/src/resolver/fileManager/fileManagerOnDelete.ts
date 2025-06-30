import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "~/resolver/fileManager/shouldBeHandled.js";
import type {
    DeleteCommandOutput,
    PutCommandOutput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ICreateS3ClientCb, IGetLambdaTriggerCb } from "./types.js";
import { convertException } from "@webiny/utils";
import { DeleteFile } from "./DeleteFile.js";

export interface ICreateFileManagerOnDeletePluginParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb;
}

export const createFileManagerOnDeletePlugin = (params: ICreateFileManagerOnDeletePluginParams) => {
    const deleteFile = new DeleteFile(params);
    return createStorerAfterEachPluginWithName<DeleteCommandOutput>("fileManager.onDelete", {
        canHandle: params => {
            const { command } = params;
            if (command !== "delete") {
                return false;
            }
            return shouldBeHandled(params);
        },
        handle: async params => {
            try {
                return await deleteFile.handle({
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
