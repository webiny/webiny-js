import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { FileManagerStorageOperations } from "~/types";

interface GetStorageOperationsParams {
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}
interface GetStorageOperationsResponse {
    storageOperations: FileManagerStorageOperations;
    plugins: Plugin[] | Plugin[][] | PluginCollection;
}
export const getStorageOperations = (
    params: GetStorageOperationsParams
): GetStorageOperationsResponse => {
    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (!storageOperations) {
        throw new Error(
            `"__getStorageOperationsPlugins" does not produce a factory function or plugins.`
        );
    }
    const { createStorageOperations, getPlugins } = storageOperations;
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `"__getStorageOperationsPlugins" does not produce a factory function "createStorageOperations".`
        );
    } else if (typeof getPlugins !== "function") {
        throw new Error(
            `"__getStorageOperationsPlugins" does not produce a plugins function "getPlugins".`
        );
    }
    return {
        storageOperations: createStorageOperations({
            plugins: params.plugins || []
        }),
        plugins: getPlugins()
    };
};
