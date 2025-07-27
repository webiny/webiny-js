import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "./shouldBeHandled.js";
import { convertException } from "@webiny/utils";
import type { ICopyFile } from "./types.js";

export interface ICreateFileManagerOnPutPluginParams {
    copyFile: ICopyFile;
}

export const createFileManagerOnPutPlugin = (params: ICreateFileManagerOnPutPluginParams) => {
    const { copyFile } = params;

    return createStorerAfterEachPluginWithName("fileManager.onPut", {
        canHandle: params => {
            const { command } = params;
            if (command !== "put") {
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
                await copyFile.handle({
                    target: params.target,
                    source: params.source,
                    key
                });
            } catch (ex) {
                console.error("Error while handling file manager onPut plugin.");
                console.log(convertException(ex));
            }
        }
    });
};
