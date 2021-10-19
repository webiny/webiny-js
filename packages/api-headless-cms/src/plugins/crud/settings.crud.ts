import { ContextPlugin } from "@webiny/handler/types";
import * as utils from "../../utils";
import {
    CmsContext,
    CmsSettingsContext,
    CmsSettingsPermission,
    CmsSettings,
    CmsSettingsStorageOperationsProviderPlugin
} from "~/types";
import WebinyError from "@webiny/error";

export default {
    type: "context",
    name: "context-settings-crud",
    apply: async context => {
        /**
         * If cms is not defined on the context, do not continue, but log it.
         */
        if (!context.cms) {
            return;
        }
        const pluginType = "cms-settings-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsSettingsStorageOperationsProviderPlugin>(
            pluginType
        );
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
        });

        const checkPermissions = (): Promise<CmsSettingsPermission> => {
            return utils.checkPermissions(context, "cms.settings");
        };

        const settings: CmsSettingsContext = {
            noAuth: () => {
                return {
                    get: async () => {
                        return await storageOperations.get();
                    }
                };
            },
            get: async (): Promise<CmsSettings | null> => {
                await checkPermissions();
                return await storageOperations.get();
            },
            updateContentModelLastChange: async (): Promise<void> => {
                const data: CmsSettings = {
                    contentModelLastChange: new Date()
                };

                const settings = await storageOperations.get();
                if (!settings) {
                    await storageOperations.create(data);
                    return;
                }

                await storageOperations.update(data);
            },
            getContentModelLastChange: async (): Promise<Date> => {
                try {
                    const settings = await storageOperations.get();
                    if (!settings || !settings.contentModelLastChange) {
                        return new Date();
                    }
                    return settings.contentModelLastChange;
                } catch (ex) {
                    console.log({
                        error: {
                            message: ex.message,
                            code: ex.code || "COULD_NOT_FETCH_CONTENT_MODEL_LAST_CHANGE",
                            data: ex
                        }
                    });
                }
                return new Date();
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings
        };
    }
} as ContextPlugin<CmsContext>;
