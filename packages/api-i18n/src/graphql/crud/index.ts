import { ContextPlugin } from "@webiny/api";
import { I18NContext } from "~/types";
import { LocalesStorageOperationsProviderPlugin } from "~/plugins/LocalesStorageOperationsProviderPlugin";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/SystemStorageOperationsProviderPlugin";
import WebinyError from "@webiny/error";
import { createLocalesCrud } from "~/graphql/crud/locales.crud";
import { createSystemCrud } from "~/graphql/crud/system.crud";

const getStorageOperations = async <T = any>(context: I18NContext, type: string): Promise<T> => {
    const providerPlugin = context.plugins.byType<any>(type).find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(
            `Missing "${LocalesStorageOperationsProviderPlugin.type}" plugin.`,
            "PLUGIN_NOT_FOUND",
            {
                type: LocalesStorageOperationsProviderPlugin.type
            }
        );
    }

    return await providerPlugin.provide({
        context
    });
};

export const createCrudContext = () => {
    return new ContextPlugin<I18NContext>(async context => {
        const localeStorageOperations = await getStorageOperations(
            context,
            LocalesStorageOperationsProviderPlugin.type
        );
        const systemStorageOperations = await getStorageOperations(
            context,
            SystemStorageOperationsProviderPlugin.type
        );

        context.i18n = {
            ...(context.i18n || ({} as any)),
            locales: createLocalesCrud({
                context,
                storageOperations: localeStorageOperations
            }),
            system: createSystemCrud({
                context,
                storageOperations: systemStorageOperations
            })
        };
    });
};
