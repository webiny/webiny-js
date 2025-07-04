import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "./shouldBeHandled.js";
import { convertException } from "@webiny/utils";
import { IDeleteFile } from "./types.js";

export interface ICreateFileManagerOnDeletePluginParams {
    deleteFile: IDeleteFile;
}

export const createFileManagerOnDeletePlugin = (params: ICreateFileManagerOnDeletePluginParams) => {
    const { deleteFile } = params;

    return createStorerAfterEachPluginWithName("fileManager.onDelete", {
        canHandle: params => {
            const { command } = params;
            if (command !== "delete") {
                return false;
            }
            return shouldBeHandled(params);
        },
        handle: async params => {
            const { item } = params;
            /**
             * We are 100% positive that the key exists here because canHandle would not allow for handle to be called.
             */
            // @ts-expect-error
            const key = (item.values["text@key"] || item.values["key"]) as string;
            try {
                await deleteFile.handle({
                    target: params.target,
                    source: params.source,
                    key
                });
            } catch (ex) {
                console.error("Error while handling file manager onDelete plugin.");
                console.log(convertException(ex));
            }
        }
    });
};
