import { I18NContext, I18NContextObject, I18NSystem } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import WebinyError from "@webiny/error";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/SystemStorageOperationsProviderPlugin";

export default new ContextPlugin<I18NContext>(async context => {
    if (!context.i18n) {
        context.i18n = {} as I18NContextObject;
    }
    const pluginType = SystemStorageOperationsProviderPlugin.type;

    const providerPlugin = context.plugins
        .byType<SystemStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    context.i18n.system = {
        getVersion: async () => {
            const system = await storageOperations.get();

            return system ? system.version : null;
        },
        setVersion: async version => {
            const original = await storageOperations.get();

            const system: I18NSystem = {
                ...(original || ({} as any)),
                version
            };
            if (original) {
                try {
                    await storageOperations.update({
                        original,
                        system
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update the system.",
                        ex.code || "SYSTEM_UPDATE_ERROR",
                        {
                            original,
                            system
                        }
                    );
                }
                return;
            }
            try {
                await storageOperations.create({
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create the system.",
                    ex.code || "SYSTEM_CREATE_ERROR",
                    {
                        version
                    }
                );
            }
        },
        install: async ({ code }) => {
            const { i18n } = context;
            const version = await i18n.system.getVersion();
            if (version) {
                throw new WebinyError("I18N is already installed.", "INSTALL_ERROR", {
                    version
                });
            }
            await i18n.locales.create({
                code,
                default: true
            });
            await i18n.system.setVersion(context.WEBINY_VERSION);
        }
    };
});
