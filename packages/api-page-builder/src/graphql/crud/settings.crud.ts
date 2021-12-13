import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import {
    PbContext,
    Settings,
    SettingsStorageOperations,
    SettingsStorageOperationsCreateParams,
    SettingsStorageOperationsGetParams
} from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";
import executeCallbacks from "./utils/executeCallbacks";
import { DefaultSettingsModel } from "~/utils/models";
import mergeWith from "lodash/mergeWith";
import Error from "@webiny/error";
import { SettingsPlugin } from "~/plugins/SettingsPlugin";
import WebinyError from "@webiny/error";
import { createStorageOperations } from "./storageOperations";
import { SettingsStorageOperationsProviderPlugin } from "~/plugins/SettingsStorageOperationsProviderPlugin";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";

interface SettingsParams {
    tenant: false | string | undefined;
    locale: false | string | undefined;
    type: string;
}

interface SettingsParamsInput extends SettingsParams {
    context: PbContext;
}
/**
 * Possible types of settings.
 * If a lot of types should be added maybe we can do it via the plugin.
 */
enum SETTINGS_TYPE {
    DEFAULT = "default"
}

const checkBasePermissions = async (context: PbContext) => {
    await context.i18nContent.checkI18NContentPermission();
    const pbPagePermission = await context.security.getPermission("pb.settings");
    if (!pbPagePermission) {
        throw new NotAuthorizedError();
    }
};

const createSettingsParams = (params: SettingsParamsInput): SettingsParams => {
    const { tenant: initialTenant, locale: initialLocale, type, context } = params;
    /**
     * If tenant or locale are false, it means we want global settings.
     */
    const tenant =
        initialTenant === false ? false : initialTenant || context.tenancy.getCurrentTenant().id;
    const locale =
        initialLocale === false
            ? false
            : initialLocale || context.i18nContent.getCurrentLocale().code;
    return {
        type,
        tenant,
        locale
    };
};

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping Settings crud.");
        return;
    }

    const storageOperations = await createStorageOperations<SettingsStorageOperations>(
        context,
        SettingsStorageOperationsProviderPlugin.type
    );

    const settingsPlugins = context.plugins.byType<SettingsPlugin>(SettingsPlugin.type);

    const settingsDataLoader = new DataLoader<SettingsParams, Settings, string>(
        async keys => {
            const promises = keys.map(key => {
                const params: SettingsStorageOperationsGetParams = {
                    where: createSettingsParams({
                        ...key,
                        context
                    })
                };
                return storageOperations.get(params);
            });
            return Promise.all(promises);
        },
        {
            cacheKeyFn: (key: SettingsParams) => {
                return [`T#${key.tenant}`, `L#${key.locale}`, `TYPE#${key.type}`].join("#");
            }
        }
    );

    context.pageBuilder.settings = {
        /**
         * For the cache key we use the identifier created by the storage operations.
         * Initial, in the DynamoDB, it was PK + SK. It can be what ever
         */
        getSettingsCacheKey(options) {
            return storageOperations.createCacheKey(options || {});
        },
        async getCurrent() {
            // With this line commented, we made this endpoint public.
            // We did this because of the public website pages which need to access the settings.
            // It's possible we'll create another GraphQL field, made for this exact purpose.
            // auth !== false && (await checkBasePermissions(context));

            const current = await context.pageBuilder.settings.get({});
            const defaults = await context.pageBuilder.settings.getDefault();

            return mergeWith({}, defaults, current, (prev, next) => {
                // No need to use falsy value if we have it set in the default settings.
                if (prev && !next) {
                    return prev;
                }
            });
        },
        async get(options) {
            // With this line commented, we made this endpoint public.
            // We did this because of the public website pages which need to access the settings.
            // It's possible we'll create another GraphQL field, made for this exact purpose.
            // auth !== false && (await checkBasePermissions(context));

            const { locale = undefined, tenant = undefined } = options || {};

            const params = createSettingsParams({
                locale,
                tenant,
                type: SETTINGS_TYPE.DEFAULT,
                context
            });
            const key = {
                tenant: params.tenant,
                locale: params.locale,
                type: params.type
            };
            try {
                return await settingsDataLoader.load(key);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get settings by given parameters.",
                    ex.code || "GET_SETTINGS_ERROR",
                    key
                );
            }
        },
        async getDefault(options) {
            const allTenants = await context.pageBuilder.settings.get({
                tenant: false,
                locale: false
            });
            const tenantAllLocales = await context.pageBuilder.settings.get({
                tenant: options ? options.tenant : undefined,
                locale: false
            });
            if (!allTenants && !tenantAllLocales) {
                return null;
            }

            return mergeWith({}, allTenants, tenantAllLocales, (next, prev) => {
                // No need to use falsy value if we have it set in the default settings.
                if (prev && !next) {
                    return prev;
                }
            });
        },
        async update(rawData, options) {
            if (!options) {
                options = {};
            }
            options.auth !== false && (await checkBasePermissions(context));

            // const targetTenant = options.tenant === false ? false : options.tenant;
            // const targetLocale = options.locale === false ? false : options.locale;

            const params = createSettingsParams({
                tenant: options.tenant,
                locale: options.locale,
                type: SETTINGS_TYPE.DEFAULT,
                context
            });

            let original = (await context.pageBuilder.settings.get(options)) as Settings;
            if (!original) {
                original = await new DefaultSettingsModel().populate({}).toJSON();

                const data: SettingsStorageOperationsCreateParams = {
                    input: rawData,
                    settings: {
                        ...original,
                        ...params
                    }
                };
                try {
                    original = await storageOperations.create(data);
                    /**
                     * Clear the cache of the data loader.
                     */
                    settingsDataLoader.clearAll();
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create settings record.",
                        ex.code || "CREATE_SETTINGS_ERROR",
                        data
                    );
                }
            }

            const settingsModel = new DefaultSettingsModel().populate(original).populate(rawData);
            await settingsModel.validate();

            const data = await settingsModel.toJSON();
            const settings: Settings = {
                ...original,
                ...data,
                ...params
            };

            // Before continuing, let's check for differences that matter.

            // 1. Check differences in `pages` property (`home`, `notFound`). If there are
            // differences, check if the pages can be set as the new `specialType` page, and then,
            // after save, make sure to trigger events, on which other plugins can do their tasks.
            const specialTypes = ["home", "notFound"];

            const changedPages = [];
            for (let i = 0; i < specialTypes.length; i++) {
                const specialType = specialTypes[i];
                const p = lodashGet(original, `pages.${specialType}`);
                const n = lodashGet(settings, `pages.${specialType}`);

                if (p !== n) {
                    // Only throw if previously we had a page (p), and now all of a sudden
                    // we don't (!n). Allows updating settings without sending these.
                    if (p && !n) {
                        throw new Error(
                            `Cannot unset "${specialType}" page. Please provide a new page if you want to unset current one.`,
                            "CANNOT_UNSET_SPECIAL_PAGE"
                        );
                    }

                    // Only load if the next page (n) has been sent, which is always a
                    // must if previously a page was defined (p).
                    if (n) {
                        const page = await context.pageBuilder.pages.getPublishedById({
                            id: n
                        });

                        changedPages.push([specialType, p, n, page]);
                    }
                }
            }

            const callbackParams = {
                context,
                previousSettings: original,
                nextSettings: settings,
                meta: {
                    diff: {
                        pages: changedPages
                    }
                }
            };
            try {
                await executeCallbacks<SettingsPlugin["beforeUpdate"]>(
                    settingsPlugins,
                    "beforeUpdate",
                    callbackParams
                );
                const result = await storageOperations.update({
                    input: rawData,
                    original,
                    settings
                });
                await executeCallbacks<SettingsPlugin["afterUpdate"]>(
                    settingsPlugins,
                    "afterUpdate",
                    callbackParams
                );
                /**
                 * Clear the cache of the data loader.
                 */
                settingsDataLoader.clearAll();

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update existing settings record.",
                    ex.code || "UPDATE_SETTINGS_ERROR",
                    {
                        original,
                        settings
                    }
                );
            }
        }
    };
});
