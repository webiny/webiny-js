import { AdminUsersContext } from "~/types";
import WebinyError from "@webiny/error";

export const getStorageOperations = async <T>(
    context: AdminUsersContext,
    type: string
): Promise<T> => {
    const providers = context.plugins.byType(type);
    /**
     * Always take the last given provider - although if everything is loaded as it must, there should not be more than one.
     * We do not check/verify for multiple providers.
     */
    const provider = providers.pop();
    if (!provider) {
        throw new WebinyError(
            `Could not find a "${type}" plugin registered.`,
            "PROVIDER_PLUGIN_ERROR",
            {
                type
            }
        );
    }

    return await provider.provide({
        context
    });
};
