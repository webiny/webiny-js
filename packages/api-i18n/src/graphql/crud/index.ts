import { ContextPlugin } from "@webiny/api";
import type { I18NContext } from "~/types.js";
import { LocalesStorageOperationsProviderPlugin } from "~/plugins/LocalesStorageOperationsProviderPlugin.js";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/SystemStorageOperationsProviderPlugin.js";
import WebinyError from "@webiny/error";
import { createLocalesCrud } from "~/graphql/crud/locales.crud.js";
import { LocalesPermissions } from "~/graphql/crud/permissions/LocalesPermissions.js";
import { AppInstaller } from "@webiny/api-tenancy/features/InstallTenant/index.js";
import { I18nInstaller } from "~/features/Installer.js";

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

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        const localesPermissions = new LocalesPermissions({
            getIdentity: () => context.security.getIdentity(),
            getPermissions: () => context.security.getPermissions("i18n.locale"),
            fullAccessPermissionName: "i18n.*"
        });

        context.i18n = {
            ...context.i18n,
            locales: createLocalesCrud({
                context,
                storageOperations: localeStorageOperations,
                localesPermissions,
                getTenant
            })
        };

        // Temporary installer to have a default locale in the system!
        context.container.registerFactory(AppInstaller, () => {
            return new I18nInstaller(context.i18n);
        });
    });
};
