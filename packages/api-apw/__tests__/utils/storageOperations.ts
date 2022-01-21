/**
 * We use @ts-ignore because __getCreateStorageOperations and __getCreateStorageOperations are attached from other projects directly to JEST context.
 */
import { Plugin, PluginCollection } from "@webiny/plugins/types";

export interface Params {
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}
export const getStorageOperations = (params: Params) => {
    // @ts-ignore
    if (typeof __getCreateStorageOperations !== "function") {
        throw new Error(`There is no global "__getCreateStorageOperations" function.`);
    }
    // @ts-ignore
    const storageOperations = __getCreateStorageOperations();
    if (!storageOperations) {
        throw new Error(
            `"__getCreateStorageOperations" does not produce a factory function or plugins.`
        );
    }
    const { createStorageOperations, getPlugins } = storageOperations;
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `"__getCreateStorageOperations" does not produce a factory function "createStorageOperations".`
        );
    } else if (typeof getPlugins !== "function") {
        throw new Error(
            `"__getCreateStorageOperations" does not produce a plugins function "getPlugins".`
        );
    }
    return {
        storageOperations: createStorageOperations({
            plugins: params.plugins || []
        }),
        plugins: getPlugins()
    };
};
