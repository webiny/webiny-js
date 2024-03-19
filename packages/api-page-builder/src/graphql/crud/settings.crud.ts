import {
    OnSettingsAfterUpdateTopicParams,
    OnSettingsBeforeUpdateTopicParams,
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
import mergeWith from "lodash/mergeWith";
import WebinyError from "@webiny/error";
import lodashGet from "lodash/get";
import DataLoader from "dataloader";
import { createTopic } from "@webiny/pubsub";
import { createSettingsCreateValidation } from "~/graphql/crud/settings/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";

interface SettingsParams {
    tenant: string;
    locale: string;
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
                return [`T#${key.tenant}`, `L#${key.locale}`].join("#");
            }
        }
    );

    const onSettingsBeforeUpdate = createTopic<OnSettingsBeforeUpdateTopicParams>(
        "pageBuilder.onSettingsBeforeUpdate"
    );
    const onSettingsAfterUpdate = createTopic<OnSettingsAfterUpdateTopicParams>(
        "pageBuilder.onSettingsAfterUpdate"
    );

    return {
        onSettingsBeforeUpdate,
        onSettingsAfterUpdate,
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
                locale: getLocaleCode()
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

        async updateSettings(this: PageBuilderContextObject, input) {
            const params = {
                tenant: getTenantId(),
                locale: getLocaleCode(),
                type: SETTINGS_TYPE.DEFAULT
            };

            let original = await this.getSettings();
            if (!original) {
                const data: SettingsStorageOperationsCreateParams = {
                    input: input,
                    settings: {
                        name: "",
                        prerendering: {
                            app: {
                                url: ""
                            },
                            storage: {
                                name: ""
                            },
                            meta: {}
                        },
                        websiteUrl: "",
                        pages: {
                            home: null,
                            notFound: null
                        },
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

            const validation = await createSettingsCreateValidation().safeParseAsync(input);
            if (!validation.success) {
                throw createZodError(validation.error);
            }
            const data = removeUndefinedValues(validation.data);

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
                const previousPage = lodashGet(original, `pages.${specialType}`);
                const nextPage = lodashGet(settings, `pages.${specialType}`);

                if (previousPage !== nextPage) {
                    // Only throw if previously we had a page (previousPage), and now all of a sudden
                    // we don't (!nextPage). Allows updating settings without sending these.
                    if (previousPage && !nextPage) {
                        throw new WebinyError(
                            `Cannot unset "${specialType}" page. Please provide a new page if you want to unset current one.`,
                            "CANNOT_UNSET_SPECIAL_PAGE"
                        );
                    }

                    // Only load if the next page (nextPage) has been sent, which is always a
                    // must if previously a page was defined (previousPage).
                    if (nextPage) {
                        const page = await this.getPublishedPageById({
                            id: nextPage
                        });

                        changedPages.push([specialType, previousPage, nextPage, page]);
                    }
                }
            }

            const meta: SettingsUpdateTopicMetaParams = {
                diff: {
                    pages: changedPages
                }
            };
            try {
                await onSettingsBeforeUpdate.publish({
                    original,
                    settings,
                    meta
                });

                const result = await storageOperations.settings.update({
                    input: input,
                    original,
                    settings
                });

                await onSettingsAfterUpdate.publish({
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
