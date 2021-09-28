import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { PbContext } from "~/types";

/**
 * Helper interface to have some kind of typing on the methods.
 * We do not have some global provider interface to be used.
 */
interface Provider<T> extends Plugin {
    provide: (params: { context: PbContext }) => T;
}

export const createStorageOperations = async <T>(context: PbContext, type: string): Promise<T> => {
    const providerPlugin = context.plugins.byType<Provider<T>>(type).find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${type}" plugin.`, "PLUGIN_NOT_FOUND", {
            type
        });
    }

    return await providerPlugin.provide({
        context
    });
};
