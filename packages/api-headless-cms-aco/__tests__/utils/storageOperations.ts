import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";

interface Params {
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

interface Response {
    storageOperations: HeadlessCmsStorageOperations;
    plugins: Plugin[] | Plugin[][] | PluginCollection;
}

export const createStorageOperations = (params: Params): Response => {
    // @ts-ignore
    if (typeof __getCreateStorageOperations !== "function") {
        throw new Error(`There is no global "__getCreateStorageOperations" function.`);
    }
    // @ts-ignore
    const { createStorageOperations, getPlugins } = __getCreateStorageOperations();
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `"__getCreateStorageOperations" does not produce a factory function "createStorageOperations".`
        );
    }
    if (typeof getPlugins !== "function") {
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
