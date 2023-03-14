import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { PbAcoContext } from "~/types";

interface GetStorageOperationsParams {
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}
interface GetStorageOperationsResponse {
    storageOperations: PbAcoContext;
    plugins: Plugin[] | Plugin[][] | PluginCollection;
}

export const createStorageOperations = (
    params: GetStorageOperationsParams
): GetStorageOperationsResponse => {
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
