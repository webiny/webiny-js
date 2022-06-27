import {
    OnAfterSettingsUpdateTopicParams,
    OnBeforeSettingsUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageSpecialType,
    PbContext,
    Settings,
    SettingsCrud,
    SettingsStorageOperationsCreateParams,
    SettingsStorageOperationsGetParams,
    SettingsUpdateTopicMetaParams
} from "~/types";
import { DefaultSettingsModel } from "~/utils/models";
import mergeWith from "lodash/mergeWith";
import WebinyError from "@webiny/error";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";
import { createTopic } from "@webiny/pubsub";

interface SettingsParams {
    tenant: string;
    locale: string;
    type: string;
}

/**
 * Possible types of settings.
 * If a lot of types should be added maybe we can do it via the plugin.
 */
enum SETTINGS_TYPE {
    DEFAULT = "default"
}

export interface CreateSettingsCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createSettingsCrud = (params: CreateSettingsCrudParams): SettingsCrud => {
    const { storageOperations, getLocaleCode, getTenantId } = params;

    const settingsDataLoader = new DataLoader<SettingsParams, Settings | null, string>(
        async keys => {
            const promises = keys.map(key => {
                const params: SettingsStorageOperationsGetParams = { where: key };
                return storageOperations.settings.get(params);
            });
            return await Promise.all(promises);
        },
        {
            cacheKeyFn: (key: SettingsParams) => {
                return [`T#${key.tenant}`, `L#${key.locale}`, `TYPE#${key.type}`].join("#");
            }
        }
    );

    const onBeforeSettingsUpdate = createTopic<OnBeforeSettingsUpdateTopicParams>();
    const onAfterSettingsUpdate = createTopic<OnAfterSettingsUpdateTopicParams>();

    return {
        onBeforeSettingsUpdate,
        onAfterSettingsUpdate,
        async getCurrentSettings(this: PageBuilderContextObject) {
            // With this line commented, we made this endpoint public.
            // We did this because of the public website pages which need to access the settings.
            // It's possible we'll create another GraphQL field, made for this exact purpose.
            // auth !== false && (await checkBasePermissions(context));

            const current = await this.getSettings();
            const defaults = await this.getDefaultSettings();

            return mergeWith({}, defaults, current, (prev, next) => {
                // No need to use falsy value if we have it set in the default settings.
                if (prev && !next) {
                    return prev;
                }
            });
        },
        async getSettings(this: PageBuilderContextObject) {
            // With this line commented, we made this endpoint public.
            // We did this because of the public website pages which need to access the settings.
            // It's possible we'll create another GraphQL field, made for this exact purpose.
            // auth !== false && (await checkBasePermissions(context));

            const key = {
                tenant: getTenantId(),
                locale: getLocaleCode(),
                type: SETTINGS_TYPE.DEFAULT
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
        async getDefaultSettings(this: PageBuilderContextObject) {
            return await storageOperations.settings.getDefaults();
        },

        async updateSettings(this: PageBuilderContextObject, rawData) {
            const params = {
                tenant: getTenantId(),
                locale: getLocaleCode(),
                type: SETTINGS_TYPE.DEFAULT
            };

            let original = (await this.getSettings()) as Settings;
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
                    original = await storageOperations.settings.create(data);
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

            const changedPages: SettingsUpdateTopicMetaParams["diff"]["pages"] = [];
            for (let i = 0; i < specialTypes.length; i++) {
                const specialType = specialTypes[i] as PageSpecialType;
                const p = lodashGet(original, `pages.${specialType}`);
                const n = lodashGet(settings, `pages.${specialType}`);

                if (p !== n) {
                    // Only throw if previously we had a page (p), and now all of a sudden
                    // we don't (!n). Allows updating settings without sending these.
                    if (p && !n) {
                        throw new WebinyError(
                            `Cannot unset "${specialType}" page. Please provide a new page if you want to unset current one.`,
                            "CANNOT_UNSET_SPECIAL_PAGE"
                        );
                    }

                    // Only load if the next page (n) has been sent, which is always a
                    // must if previously a page was defined (p).
                    if (n) {
                        const page = await this.getPublishedPageById({
                            id: n
                        });

                        changedPages.push([specialType, p, n, page]);
                    }
                }
            }

            const meta: SettingsUpdateTopicMetaParams = {
                diff: {
                    pages: changedPages
                }
            };
            try {
                await onBeforeSettingsUpdate.publish({
                    original,
                    settings,
                    meta
                });

                const result = await storageOperations.settings.update({
                    input: rawData,
                    original,
                    settings
                });

                await onAfterSettingsUpdate.publish({
                    original,
                    settings,
                    meta
                });
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
};
