/**
 * We use @ts-ignore because __getStorageOperations is attached from other projects directly to JEST context.
 */
import { Plugin, PluginCollection } from "@webiny/plugins/types";

interface GetStorageOperationsParams {
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    documentClient: any;
}
export const getStorageOperations = (params: GetStorageOperationsParams) => {
    // @ts-ignore
    if (typeof __getStorageOperations !== "function") {
        throw new Error(`There is no global "__getStorageOperations" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperations();
    if (!storageOperations) {
        throw new Error(`"__getStorageOperations" does not produce a factory function or plugins.`);
    }

    return {
        ...storageOperations,
        plugins: [
            ...storageOperations.plugins,
            ...(Array.isArray(params.plugins) ? params.plugins : [])
        ]
    };
};
